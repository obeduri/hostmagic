import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import httpProxy from 'http-proxy';
import pc from 'picocolors';
import { syncHostsBlock, HOSTMAGIC_SETTINGS_DOMAIN, ensureSystemHostsEntry } from './hosts.js';
import {
  getKnownProjects,
  registerProjectInGlobalRegistry,
  unregisterProjectFromGlobalRegistry,
  loadRegistry,
  saveRegistry,
} from './registry.js';
import { pickFolderDialog } from './dialog.js';
import { ProcessManager } from './process-manager.js';
import { allocateUniquePorts } from './port.js';
import { freePortIfOccupied, checkAndCleanNextLock } from './port-killer.js';
import { getDefaultDashboardTemplate } from './dashboard-template.js';
import { detectServices } from './detector.js';
import {
  isAutostartEnabled,
  enableAutostart,
  disableAutostart,
  getAutostartStatus,
} from './autostart.js';
import { SUPPORTED_IDES, launchIde, type IdeDefinition } from './ide-launcher.js';
import { getLogoBuffer, getLogoDataUri, getPwaManifest, getPwaServiceWorker } from './pwa-assets.js';
import type {
  HostmagicConfig,
  DashboardProjectInfo,
  ServiceRuntimeInfo,
  ServiceConfig,
} from '../types.js';

export interface ProxyRoute {
  domain: string;
  targetPort: number;
  serviceName?: string;
  type?: 'frontend' | 'backend' | 'custom' | string;
}

export interface ProjectRegistration {
  name: string;
  routes: ProxyRoute[];
  frontendPort?: number;
}

export interface ReverseProxyServerOptions {
  showProjectLogs?: boolean;
}

export class ReverseProxyServer {
  private server: http.Server;
  private oauthBridgeServer?: http.Server;
  private proxy: httpProxy;
  private routes: Map<string, number> = new Map();
  private projects: Map<string, ProjectRegistration> = new Map();
  private projectProcessManagers: Map<string, ProcessManager> = new Map();
  private showProjectLogs = false;
  private activeLocalhostTarget?: string;
  private listeningPort = 80;
  private oauthStateCache: Map<
    string,
    { domain: string; timestamp: number }
  > = new Map();
  private lastOAuthDomain?: string;
  private lastActiveProject?: string;

  private static logBuffers: Map<string, string[]> = new Map();
  private static MAX_LOG_LINES = 1000;

  public static appendLog(key: string, line: string): void {
    const cleanKey = key.toLowerCase().trim();
    let buffer = ReverseProxyServer.logBuffers.get(cleanKey);
    if (!buffer) {
      buffer = [];
      ReverseProxyServer.logBuffers.set(cleanKey, buffer);
    }
    buffer.push(line);
    if (buffer.length > ReverseProxyServer.MAX_LOG_LINES) {
      buffer.shift();
    }
  }

  public static getLogs(key: string): string[] {
    const cleanKey = key.toLowerCase().trim();
    return ReverseProxyServer.logBuffers.get(cleanKey) || [];
  }

  public static clearLogs(key?: string): void {
    if (key) {
      ReverseProxyServer.logBuffers.delete(key.toLowerCase().trim());
    } else {
      ReverseProxyServer.logBuffers.clear();
    }
  }

  public static async pushLogsToGateway(
    port: number = 80,
    target: string,
    lines: string[]
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = JSON.stringify({ target, lines });
      const req = http.request(
        `http://127.0.0.1:${port}/__hostmagic/api/logs/push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  }

  private static customTemplateHtml?: string;

  public static getDashboardTemplate(): string {
    return ReverseProxyServer.customTemplateHtml || ReverseProxyServer.getDefaultDashboardTemplate();
  }

  public static setDashboardTemplate(template: string): void {
    ReverseProxyServer.customTemplateHtml = template;
  }

  public static async refreshSettingsOnGateway(
    port: number = 80,
    template?: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        template: template || ReverseProxyServer.getDashboardTemplate(),
      });
      const req = http.request(
        `http://127.0.0.1:${port}/__hostmagic/api/refresh-settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  }

  constructor(
    initialProject?: ProjectRegistration,
    options?: ReverseProxyServerOptions
  ) {
    this.showProjectLogs = Boolean(options?.showProjectLogs);
    this.proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      xfwd: true,
      ws: true,
    });

    if (initialProject) {
      this.registerProject(initialProject);
    }

    // Universal OAuth 2.0 Authorization URL Rewriting:
    // If an authorization initiation redirect uses a .test or .local redirect_uri,
    // rewrite it to http://localhost:3000 for compatibility with providers that disallow custom HTTP TLDs,
    // and remember the origin domain in oauthStateCache.
    this.proxy.on('proxyRes', (proxyRes, req) => {
      const rawHost = req.headers.host || '';
      const host = rawHost.split(':')[0].toLowerCase();
      const location = proxyRes.headers['location'];

      if (location) {
        const isOAuthRedirect =
          location.includes('redirect_uri=') ||
          location.includes('/oauth') ||
          location.includes('/authorize') ||
          location.includes('/auth/');

        if (isOAuthRedirect) {
          if (host && (host.endsWith('.test') || host.endsWith('.local') || this.routes.has(host))) {
            this.lastOAuthDomain = host;
          }

          try {
            const parsed = new URL(location);
            const state = parsed.searchParams.get('state');
            if (state && host) {
              this.oauthStateCache.set(state, {
                domain: host,
                timestamp: Date.now(),
              });
            }

            const redirectUri = parsed.searchParams.get('redirect_uri');
            if (redirectUri) {
              let rewrittenUri = redirectUri;
              try {
                const parsedRedirect = new URL(redirectUri);
                if (
                  parsedRedirect.hostname.endsWith('.test') ||
                  parsedRedirect.hostname.endsWith('.local') ||
                  this.routes.has(parsedRedirect.hostname.toLowerCase())
                ) {
                  rewrittenUri = `http://localhost:3000${parsedRedirect.pathname}${parsedRedirect.search}${parsedRedirect.hash}`;
                }
              } catch {
                rewrittenUri = redirectUri.replace(
                  /http:\/\/[^/]+\.(test|local)/g,
                  'http://localhost:3000'
                );
              }

              if (rewrittenUri !== redirectUri) {
                parsed.searchParams.set('redirect_uri', rewrittenUri);
                proxyRes.headers['location'] = parsed.toString();
              }
            }
          } catch {
            if (location.includes('.test') || location.includes('.local')) {
              proxyRes.headers['location'] = location.replace(
                /http%3A%2F%2F[^%]+?\.(test|local)/gi,
                'http%3A%2F%2Flocalhost%3A3000'
              );
            }
          }
        } else {
          // If response redirects to localhost:3000 (e.g. NextAuth redirecting to callbackUrl),
          // rewrite back to the active project domain so developer stays on their .test domain!
          try {
            const parsedLoc = new URL(location);
            if (
              (parsedLoc.hostname === 'localhost' || parsedLoc.hostname === '127.0.0.1') &&
              parsedLoc.port === '3000' &&
              !parsedLoc.searchParams.has('client_id')
            ) {
              const targetDomain =
                (host && host !== 'localhost' && host !== '127.0.0.1' ? host : undefined) ||
                this.lastOAuthDomain ||
                this.getDefaultProjectDomain();
              if (targetDomain) {
                proxyRes.headers['location'] = `http://${targetDomain}${parsedLoc.pathname}${parsedLoc.search}${parsedLoc.hash}`;
              }
            }
          } catch {}
        }
      }

      // Sanitize cookies for local development:
      // Remove '; Domain=localhost' or '; Domain=127.0.0.1' so cookie binds to current origin
      // Remove '; Secure' so cookie works over local HTTP
      const rawSetCookie = proxyRes.headers['set-cookie'];
      if (rawSetCookie) {
        const cookies = (Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie]).map((c) =>
          c.replace(/;\s*domain=(localhost|127\.0\.0\.1)/gi, '')
           .replace(/;\s*secure/gi, '')
        );
        proxyRes.headers['set-cookie'] = cookies;
      }

      // Sanitize Access-Control-Allow-Origin for local development HMR/API:
      const allowOrigin = proxyRes.headers['access-control-allow-origin'];
      if (allowOrigin && (allowOrigin.includes('127.0.0.1') || allowOrigin.includes('localhost'))) {
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          proxyRes.headers['access-control-allow-origin'] = `http://${host}`;
        }
      }

      // Guarantee instant, unbuffered HMR updates (Next.js Fast Refresh, Vite HMR, Turbopack, Astro, Remix SSE):
      const reqUrl = req?.url || '';
      const contentType = proxyRes.headers['content-type'] || '';
      const isHmrStreamOrChunk =
        reqUrl.includes('webpack-hmr') ||
        reqUrl.includes('turbopack-hmr') ||
        reqUrl.includes('hot-update') ||
        reqUrl.includes('/@vite') ||
        reqUrl.includes('/_next/static/webpack/') ||
        contentType.includes('text/event-stream');

      if (isHmrStreamOrChunk) {
        // Disable intermediate caching so changed styles, components, and chunks are fetched fresh immediately
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        proxyRes.headers['pragma'] = 'no-cache';
        proxyRes.headers['expires'] = '0';
        // Disable buffering for real-time Server-Sent Events (SSE) and fast chunk delivery
        proxyRes.headers['x-accel-buffering'] = 'no';
      }
    });

    // Error handler for proxy errors (e.g. backend service still spinning up or WebSocket disconnect)
    this.proxy.on('error', (err: any, req: any, res: any) => {
      const host = (req?.headers?.host || '').split(':')[0].toLowerCase();
      const targetPort = this.routes.get(host);

      if (res && !res.headersSent && typeof res.writeHead === 'function') {
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Hostmagic - Service Starting</title></head>
            <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center;">
              <h1 style="color: #c084fc;">🧙‍♂️ Hostmagic Gateway</h1>
              <p style="font-size: 1.2rem;">Service <strong>${host}</strong> is starting up on internal port <code>${targetPort || 'unknown'}</code>...</p>
              <p style="color: #94a3b8;">Please refresh in a few seconds.</p>
            </body>
          </html>
        `);
      } else if (res && typeof res.destroy === 'function' && !res.destroyed) {
        try { res.destroy(); } catch {}
      }
    });

    this.server = http.createServer(this.requestHandler);
    this.server.on('upgrade', this.upgradeHandler);
  }

  private oauthBridgeRequestHandler = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> => {
    // Universal OAuth 2.0 Bridge: Catch any request arriving at localhost:3000
    // and seamlessly redirect to http://[target_domain].test<path><query>
    const targetDomain = this.resolveTargetDomain(req);
    if (targetDomain) {
      const statusCode = req.method === 'POST' ? 307 : 302;
      res.writeHead(statusCode, {
        Location: `http://${targetDomain}${req.url || '/'}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      res.end();
      return;
    }

    // Fall back to general request handler if no target domain is known
    await this.requestHandler(req, res);
  };

  private requestHandler = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> => {
    const rawHost = req.headers.host || '';
    const host = rawHost.split(':')[0].toLowerCase();
    const url = req.url || '/';

    const isSettingsHost =
      host === HOSTMAGIC_SETTINGS_DOMAIN ||
      host === 'settings.hostmagic' ||
      host.startsWith('hostmagic.settings:') ||
      host.startsWith('settings.hostmagic:');

    // Track active OAuth origin when auth initiation request arrives on a project domain
    if (url.includes('/api/auth') || url.includes('/auth/')) {
      if (host && host !== 'localhost' && host !== '127.0.0.1' && !isSettingsHost) {
        this.lastOAuthDomain = host;
        for (const [pName, p] of this.projects.entries()) {
          if (p.routes.some((r) => r.domain === host)) {
            this.lastActiveProject = pName;
            break;
          }
        }
      }
    }

    const pathname = (url.split('?')[0] || '/').toLowerCase();

    // PWA Manifest
    if (
      pathname === '/__hostmagic/manifest.json' ||
      pathname === '/__hostmagic/manifest.webmanifest' ||
      (isSettingsHost && (pathname === '/manifest.json' || pathname === '/manifest.webmanifest'))
    ) {
      res.writeHead(200, {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(getPwaManifest(isSettingsHost, host));
      return;
    }

    // PWA Service Worker
    if (pathname === '/__hostmagic/sw.js' || (isSettingsHost && pathname === '/sw.js')) {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache',
      });
      res.end(getPwaServiceWorker());
      return;
    }

    // PWA Logo, Favicon & App Icons (magichost.webp)
    if (
      pathname === '/__hostmagic/magichost.webp' ||
      pathname === '/__hostmagic/logo.webp' ||
      pathname === '/__hostmagic/favicon.ico' ||
      pathname === '/__hostmagic/favicon.png' ||
      pathname === '/magichost.webp' ||
      (isSettingsHost && (
        pathname === '/favicon.ico' ||
        pathname === '/favicon.png' ||
        pathname === '/apple-touch-icon.png' ||
        pathname === '/apple-touch-icon-precomposed.png' ||
        pathname === '/logo.webp'
      )) ||
      (pathname === '/favicon.ico' && !this.routes.has(host))
    ) {
      const logoBuffer = getLogoBuffer();
      const isIco = pathname.endsWith('.ico');
      res.writeHead(200, {
        'Content-Type': isIco ? 'image/x-icon' : 'image/webp',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': logoBuffer.length,
      });
      res.end(logoBuffer);
      return;
    }

    // 1. Hostmagic Settings & Hub Dashboard
    if (
      (isSettingsHost && (url === '/' || url === '' || url === '/settings' || url === '/dashboard')) ||
      url === '/__hostmagic' ||
      url === '/__hostmagic/' ||
      url === '/__hostmagic/hub' ||
      url === '/__hostmagic/settings'
    ) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(this.renderSettingsDashboardHtml());
      return;
    }

    // 2. Hostmagic Settings & Logs REST API
    const isApiRequest = url.startsWith('/__hostmagic/api/') || (isSettingsHost && url.startsWith('/api/'));
    if (isApiRequest) {
      const apiPath = url.startsWith('/__hostmagic/api/')
        ? url.slice('/__hostmagic/api/'.length).split('?')[0]
        : url.slice('/api/'.length).split('?')[0];

      if (apiPath === 'status' && req.method === 'GET') {
        const allRoutes: Array<{
          domain: string;
          targetPort: number;
          projectName: string;
          serviceName: string;
          type: string;
        }> = [];

        for (const [pName, p] of this.projects.entries()) {
          for (const r of p.routes) {
            allRoutes.push({
              domain: r.domain,
              targetPort: r.targetPort,
              projectName: pName,
              serviceName: r.serviceName || r.domain.split('.')[0],
              type: r.type || (p.frontendPort === r.targetPort ? 'frontend' : 'custom'),
            });
          }
        }

        for (const [domain, port] of this.routes.entries()) {
          if (!allRoutes.some((r) => r.domain.toLowerCase() === domain.toLowerCase())) {
            allRoutes.push({
              domain,
              targetPort: port,
              projectName: 'standalone',
              serviceName: domain.split('.')[0],
              type: 'custom',
            });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            hostmagic: true,
            version: '1.1.1',
            projects: Array.from(this.projects.values()),
            routes: allRoutes,
          })
        );
        return;
      }

      if (apiPath === 'logs' && req.method === 'GET') {
        const parsedUrl = new URL(url, `http://${rawHost}`);
        const target = parsedUrl.searchParams.get('target') || '';
        const logs = ReverseProxyServer.getLogs(target);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ target, logs }));
        return;
      }

      if (apiPath === 'logs/push' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          if (body) {
            const lines: string[] = Array.isArray(body.lines) ? body.lines : [body.line || ''];
            const targets: string[] = [body.target, body.domain, body.name].filter(Boolean);
            for (const t of targets) {
              for (const line of lines) {
                if (line) ReverseProxyServer.appendLog(t, line);
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: lines.length }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid logs payload' }));
        return;
      }

      if (apiPath === 'routes' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          if (body && body.domain && body.targetPort) {
            const cleanDomain = String(body.domain).toLowerCase().trim();
            const portNum = parseInt(String(body.targetPort), 10);
            const projName = String(body.name || body.projectName || 'custom').trim();
            const sName = String(body.serviceName || cleanDomain.split('.')[0]).trim();
            const sType = String(body.type || 'custom').trim();

            this.registerRoute(cleanDomain, portNum);

            let proj = this.projects.get(projName);
            if (!proj) {
              proj = { name: projName, routes: [] };
              this.projects.set(projName, proj);
            }
            proj.routes = proj.routes.filter((r) => r.domain.toLowerCase() !== cleanDomain);
            proj.routes.push({
              domain: cleanDomain,
              targetPort: portNum,
              serviceName: sName,
              type: sType,
            });

            try {
              await syncHostsBlock(projName, proj.routes.map((r) => r.domain));
            } catch {}

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: true,
                route: { domain: cleanDomain, targetPort: portNum, projectName: projName },
              })
            );
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid route payload' }));
        return;
      }

      if (apiPath === 'routes' && req.method === 'DELETE') {
        try {
          const body = await this.readJsonBody(req);
          if (body && (body.domain || body.name)) {
            const cleanDomain = body.domain ? String(body.domain).toLowerCase().trim() : undefined;
            const projName = body.name || body.projectName;

            if (cleanDomain) {
              this.routes.delete(cleanDomain);
              for (const [pName, p] of this.projects.entries()) {
                p.routes = p.routes.filter((r) => r.domain.toLowerCase() !== cleanDomain);
                if (p.routes.length === 0 && (!projName || projName === pName)) {
                  this.projects.delete(pName);
                }
              }
            } else if (projName) {
              this.unregisterProject(projName);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, deleted: cleanDomain || projName }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid delete route payload' }));
        return;
      }

      if (apiPath === 'projects' && req.method === 'GET') {
        const projects = await this.getDashboardProjects();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ hostmagic: true, projects }));
        return;
      }

      if (apiPath === 'projects/start' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const target = body?.name || body?.path || body?.projectName;
          if (!target) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Project name or path is required' }));
            return;
          }
          const result = await this.startProjectByNameOrPath(target);
          if (result.success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error || 'Failed to start project' }));
          }
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          return;
        }
      }

      if ((apiPath === 'projects/restart' || apiPath === 'projects/restart-all') && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const target = body?.name || body?.path || body?.projectName;
          if (target) {
            const result = await this.startProjectByNameOrPath(target);
            if (result.success) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: result.error || 'Failed to restart project' }));
            }
          } else {
            const running = Array.from(this.projectProcessManagers.keys());
            for (const name of running) {
              await this.startProjectByNameOrPath(name);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, restarted: running }));
          }
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          return;
        }
      }

      if (apiPath === 'projects/stop' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const target = body?.name || body?.projectName;
          if (!target) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Project name is required' }));
            return;
          }
          const result = await this.stopProjectByName(target);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          return;
        }
      }

      if (apiPath === 'projects/add' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const pPath = body?.path ? String(body.path).trim() : undefined;
          if (!pPath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Directory path is required' }));
            return;
          }
          const resolvedPath = path.resolve(pPath);
          const configPath = path.join(resolvedPath, '.hostmagic.json');
          if (!existsSync(configPath)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `.hostmagic.json not found in "${resolvedPath}"` }));
            return;
          }
          const raw = await fs.readFile(configPath, 'utf-8');
          const config: HostmagicConfig = JSON.parse(raw);
          const entry = await registerProjectInGlobalRegistry(config, resolvedPath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, project: entry }));
          return;
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Failed to add project' }));
          return;
        }
      }

      if ((apiPath === 'projects/pick-folder' || apiPath === 'projects/browse') && (req.method === 'POST' || req.method === 'GET')) {
        try {
          const picked = await pickFolderDialog('Select Project Folder containing .hostmagic.json');
          if (!picked) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, cancelled: true }));
            return;
          }
          const resolvedPath = path.resolve(picked);
          const configPath = path.join(resolvedPath, '.hostmagic.json');
          let hasConfig = false;
          let config: HostmagicConfig | undefined;
          if (existsSync(configPath)) {
            try {
              const raw = await fs.readFile(configPath, 'utf-8');
              config = JSON.parse(raw);
              hasConfig = true;
            } catch {}
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, path: resolvedPath, hasConfig, config }));
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Failed to open folder picker dialog' }));
          return;
        }
      }

      if (apiPath === 'projects/init-folder' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          let targetPath = body?.path ? String(body.path).trim() : undefined;
          if (!targetPath) {
            const picked = await pickFolderDialog('Select Project Folder for Hostmagic Initialization');
            if (!picked) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, cancelled: true }));
              return;
            }
            targetPath = picked;
          }
          const result = await this.initProjectAtFolder(targetPath, body?.domain);
          if (result.success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error || 'Failed to initialize project' }));
          }
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Failed to initialize project folder' }));
          return;
        }
      }

      if (apiPath === 'projects' && req.method === 'DELETE') {
        try {
          const body = await this.readJsonBody(req);
          const target = body?.name || body?.projectName;
          if (target) {
            await unregisterProjectFromGlobalRegistry(target);
            await this.stopProjectByName(target);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, deleted: target }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Project name is required' }));
        return;
      }

      if (apiPath === 'projects/customize' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const target = body?.name || body?.projectName;
          if (target) {
            const registry = await loadRegistry();
            const project = registry.projects.find(
              (p) => p.name.toLowerCase() === String(target).toLowerCase()
            );
            if (project) {
              if (body.icon !== undefined) project.icon = body.icon || undefined;
              if (body.color !== undefined) project.color = body.color || undefined;
              await saveRegistry(registry);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, name: target, icon: body.icon, color: body.color }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Project name is required' }));
        return;
      }

      if (apiPath === 'autostart' && req.method === 'GET') {
        const status = await getAutostartStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...status }));
        return;
      }

      if (apiPath === 'autostart' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const enable = Boolean(body?.enabled);
          const result = enable ? await enableAutostart() : await disableAutostart();
          const currentStatus = await isAutostartEnabled();
          if (result.success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, enabled: currentStatus }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error || 'Failed to update autostart setting' }));
          }
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          return;
        }
      }

      if ((apiPath === 'ides' || apiPath === 'projects/ides') && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ides: SUPPORTED_IDES }));
        return;
      }

      if ((apiPath === 'projects/open-ide' || apiPath === 'open-ide') && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          const ide = body?.ide || body?.editor || 'vscode';
          let targetPath = body?.path ? String(body.path).trim() : undefined;
          const targetName = body?.name || body?.projectName;
          const targetDomain = body?.domain;

          if (!targetPath && (targetName || targetDomain)) {
            const known = await getKnownProjects();
            const found = known.find(p => {
              if (targetName && p.name.toLowerCase() === String(targetName).toLowerCase()) return true;
              if (targetDomain && p.services?.some(s => s.domain?.toLowerCase() === String(targetDomain).toLowerCase())) return true;
              const baseName = targetDomain ? String(targetDomain).split('.')[0].toLowerCase() : '';
              if (baseName && p.name.toLowerCase() === baseName) return true;
              return false;
            });
            if (found?.path) {
              targetPath = found.path;
            }
          }

          if (!targetPath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, needPath: true, error: 'Project folder is not linked yet.' }));
            return;
          }

          const launchResult = await launchIde(ide, targetPath);
          res.writeHead(launchResult.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(launchResult));
          return;
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message || 'Failed to open project in IDE' }));
          return;
        }
      }

      if (apiPath === 'refresh-settings' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          if (body && body.template) {
            ReverseProxyServer.setDashboardTemplate(body.template);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Settings dashboard updated' }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to refresh settings' }));
          return;
        }
      }
    }

    if (url.startsWith('/__hostmagic/')) {
      if (url === '/__hostmagic/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            hostmagic: true,
            version: '1.1.1',
            projects: Array.from(this.projects.values()),
          })
        );
        return;
      }

      if (url === '/__hostmagic/register' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          if (body && body.name && Array.isArray(body.routes)) {
            this.registerProject(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, project: body.name }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid project payload' }));
        return;
      }

      if (url === '/__hostmagic/unregister' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          if (body && body.name) {
            this.unregisterProject(body.name);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, unregistered: body.name }));
            return;
          }
        } catch {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid project payload' }));
        return;
      }

      if (url.startsWith('/__hostmagic/select-target')) {
        const parsedUrl = new URL(req.url || '/', `http://${rawHost}`);
        const target = parsedUrl.searchParams.get('project');
        if (target && this.projects.has(target)) {
          this.activeLocalhostTarget = target;
          res.writeHead(302, {
            'Set-Cookie': `hostmagic_target=${target}; Path=/; SameSite=Lax`,
            Location: '/',
          });
          res.end();
          return;
        }
      }

      if (url === '/__hostmagic/refresh-settings' && req.method === 'POST') {
        try {
          const body = await this.readJsonBody(req);
          if (body && body.template) {
            ReverseProxyServer.setDashboardTemplate(body.template);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Settings dashboard updated' }));
          return;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to refresh settings' }));
          return;
        }
      }
    }

    // 2. Localhost & 127.0.0.1 routing (for OAuth callbacks or manual visits)
    if (host === 'localhost' || host === '127.0.0.1') {
      const isOAuthCallback =
        url.includes('/api/auth/callback') ||
        url.includes('/auth/callback') ||
        url.includes('/callback') ||
        (url.includes('code=') && (url.includes('state=') || url.includes('scope=')));

      // If an OAuth callback arrives on localhost port 80, redirect to target .test domain
      if (isOAuthCallback) {
        const targetDomain = this.resolveTargetDomain(req);
        if (targetDomain) {
          const statusCode = req.method === 'POST' ? 307 : 302;
          res.writeHead(statusCode, {
            Location: `http://${targetDomain}${url}`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          });
          res.end();
          return;
        }
      }

      const targetPort = this.resolveLocalhostTarget(req);
      if (targetPort) {
        this.proxy.web(req, res, { target: `http://127.0.0.1:${targetPort}` });
        return;
      }

      // When multiple projects are running and no specific target selected, show Gateway Hub
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(this.renderGatewayHubHtml());
      return;
    }

    // 3. Domain-specific routing (e.g. abogando.test, api.abogando.test)
    const targetPort = this.routes.get(host);
    if (targetPort) {
      // Automatically track the project the developer is actively browsing
      for (const [pName, p] of this.projects.entries()) {
        if (p.routes.some((r) => r.domain === host)) {
          this.lastActiveProject = pName;
          break;
        }
      }

      // Zero-config OAuth: Mask all requests to auth/login endpoints through localhost:3000
      const isAuthRequest =
        url.startsWith('/api/auth') ||
        url.startsWith('/auth') ||
        url === '/login' ||
        url.startsWith('/login?') ||
        url.startsWith('/signin');

      if (isAuthRequest) {
        this.lastOAuthDomain = host;
        req.headers['x-forwarded-host'] = 'localhost:3000';
        req.headers['x-forwarded-proto'] = 'http';
        req.headers['x-forwarded-port'] = '3000';
      }

      // Transparent HMR & Fast Refresh Support for Next.js, Vite, Turbopack, Astro, Remix:
      // When dev servers (Next.js 14/15, Vite, Webpack, etc.) receive HMR requests
      // (like /_next/webpack-hmr, /_next/hmr, dev polling, or dynamic chunks), they check the Origin & Referer headers.
      // If Origin/Referer is http://my-app.test while the internal server is on localhost:PORT,
      // dev servers block the request with cross-origin errors or disconnect the HMR WebSocket/SSE stream.
      // By normalizing the Origin and Referer to match the internal target (for dev resources or same-origin requests),
      // dev servers recognize the request as same-origin, guaranteeing 100% reliable Fast Refresh & Hot Reloading!
      const isDevResource =
        url.startsWith('/_next/') ||
        url.startsWith('/@vite') ||
        url.startsWith('/__vite') ||
        url.startsWith('/_astro') ||
        url.startsWith('/@fs') ||
        url.startsWith('/@id') ||
        url.startsWith('/__turbopack') ||
        url.startsWith('/_remix') ||
        url.startsWith('/_nuxt') ||
        url.startsWith('/_app') ||
        url.startsWith('/__webpack') ||
        url.includes('webpack-hmr') ||
        url.includes('turbopack-hmr') ||
        url.includes('hot-update') ||
        url.includes('hmr') ||
        url.includes('sockjs-node') ||
        url.includes('/ws');

      const rawOrigin = req.headers.origin;
      const isSameOriginToHost =
        rawOrigin &&
        (rawOrigin === `http://${host}` ||
         rawOrigin === `https://${host}` ||
         rawOrigin === `http://${rawHost}` ||
         rawOrigin === `https://${rawHost}`);

      if (isDevResource || isSameOriginToHost) {
        req.headers['x-forwarded-host'] = rawHost;
        req.headers['x-forwarded-proto'] = 'http';
        req.headers['x-forwarded-for'] = req.socket.remoteAddress || '127.0.0.1';
        if (req.headers.origin) {
          req.headers.origin = `http://127.0.0.1:${targetPort}`;
        }
        if (req.headers.referer) {
          req.headers.referer = req.headers.referer.replace(
            /^https?:\/\/[^/]+/i,
            `http://127.0.0.1:${targetPort}`
          );
        }
      }

      this.proxy.web(req, res, {
        target: `http://127.0.0.1:${targetPort}`,
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await this.renderNotFoundHtml(rawHost));
    }
  };

  private upgradeHandler = (
    req: http.IncomingMessage,
    socket: any,
    head: Buffer
  ): void => {
    const rawHost = req.headers.host || '';
    const host = rawHost.split(':')[0].toLowerCase();

    let targetPort: number | undefined;
    if (host === 'localhost' || host === '127.0.0.1') {
      targetPort = this.resolveLocalhostTarget(req);
    } else {
      targetPort = this.routes.get(host);
    }

    if (targetPort) {
      // Preserve original host in forwarded headers
      req.headers['x-forwarded-host'] = rawHost;
      req.headers['x-forwarded-proto'] = 'http';
      req.headers['x-forwarded-for'] = req.socket.remoteAddress || '127.0.0.1';

      // Normalize Origin & Referer for WebSocket HMR (Next.js Fast Refresh, Vite HMR, Astro HMR, Remix)
      // When the browser connects from http://<app>.test, Next.js 14/15 and Vite WebSocket
      // servers check whether Origin matches the internal listening address.
      // Normalizing Origin ensures HMR WebSockets are never blocked by cross-origin checks!
      if (req.headers.origin) {
        req.headers.origin = `http://127.0.0.1:${targetPort}`;
      }
      if (req.headers['sec-websocket-origin']) {
        req.headers['sec-websocket-origin'] = `http://127.0.0.1:${targetPort}`;
      }
      if (req.headers.referer) {
        req.headers.referer = req.headers.referer.replace(
          /^https?:\/\/[^/]+/i,
          `http://127.0.0.1:${targetPort}`
        );
      }

      this.proxy.ws(req, socket, head, {
        target: `ws://127.0.0.1:${targetPort}`,
        changeOrigin: true,
      });
    } else {
      socket.destroy();
    }
  };

  public registerProject(project: ProjectRegistration): void {
    // Remove previous routes for this project if re-registering
    if (this.projects.has(project.name)) {
      this.unregisterProject(project.name);
    }

    this.projects.set(project.name, project);
    for (const route of project.routes) {
      this.registerRoute(route.domain, route.targetPort);
    }

    const domainList = project.routes.map((r) => r.domain).join(', ');
    console.log(
      pc.cyan(`  ⚡ [GATEWAY] Project connected: ${pc.bold(project.name)}${domainList ? pc.dim(` (${domainList})`) : ''}`)
    );
  }

  public unregisterProject(projectName: string): void {
    const project = this.projects.get(projectName);
    if (!project) return;

    for (const route of project.routes) {
      this.routes.delete(route.domain.toLowerCase().trim());
    }
    this.projects.delete(projectName);

    if (this.activeLocalhostTarget === projectName) {
      this.activeLocalhostTarget = undefined;
    }

    console.log(pc.dim(`  🔌 [GATEWAY] Project disconnected: ${projectName}`));
  }

  public async getDashboardProjects(): Promise<DashboardProjectInfo[]> {
    const known = await getKnownProjects();
    const result: DashboardProjectInfo[] = [];
    const processedNames = new Set<string>();

    for (const p of known) {
      const pNameLower = p.name.toLowerCase();
      processedNames.add(pNameLower);

      const activeProject =
        this.projects.get(p.name) ||
        Array.from(this.projects.values()).find(
          (ap) => ap.name.toLowerCase() === pNameLower
        );
      const isRunning = Boolean(activeProject);
      const isStartedByGateway = this.projectProcessManagers.has(pNameLower);

      const servicesWithStatus = (p.services || []).map((s) => {
        const cleanDomain = s.domain;
        const livePort = isRunning && activeProject
          ? activeProject.routes.find((r) => r.domain.toLowerCase() === cleanDomain.toLowerCase())?.targetPort ||
            this.routes.get(cleanDomain.toLowerCase()) ||
            s.port
          : s.port;
        return {
          ...s,
          url: `http://${cleanDomain}`,
          livePort,
        };
      });

      result.push({
        name: p.name,
        path: p.path,
        tld: p.tld || 'test',
        icon: p.icon,
        color: p.color,
        status: isRunning ? 'running' : 'stopped',
        services: servicesWithStatus,
        routes: activeProject
          ? activeProject.routes
          : (p.services || []).map((s) => ({
              domain: s.domain,
              targetPort: s.port || 0,
              serviceName: s.name,
              type: s.type,
            })),
        startedByGateway: isStartedByGateway,
      });
    }

    // Also include any actively running projects that might not have been in registry
    for (const [pName, p] of this.projects.entries()) {
      if (!processedNames.has(pName.toLowerCase()) && pName !== 'standalone' && pName !== 'custom') {
        processedNames.add(pName.toLowerCase());
        const servicesWithStatus = p.routes.map((r) => ({
          name: r.serviceName || r.domain.split('.')[0],
          path: '.',
          type: (r.type || (p.frontendPort === r.targetPort ? 'frontend' : 'custom')) as any,
          domain: r.domain,
          command: 'npm run dev',
          port: r.targetPort,
          url: `http://${r.domain}`,
          livePort: r.targetPort,
        }));

        result.push({
          name: p.name,
          path: process.cwd(),
          tld: p.routes[0]?.domain.split('.').pop() || 'test',
          status: 'running',
          services: servicesWithStatus,
          routes: p.routes,
          startedByGateway: this.projectProcessManagers.has(pName.toLowerCase()),
        });
      }
    }

    return result;
  }

  public async startProjectByNameOrPath(nameOrPath: string): Promise<{
    success: boolean;
    project?: string;
    error?: string;
  }> {
    const known = await getKnownProjects();
    const query = nameOrPath.toLowerCase().trim();
    const targetProject = known.find(
      (p) =>
        p.name.toLowerCase() === query ||
        path.resolve(p.path).toLowerCase() === path.resolve(nameOrPath).toLowerCase()
    );

    let projectDir = targetProject ? targetProject.path : path.resolve(nameOrPath);
    let configPath = path.join(projectDir, '.hostmagic.json');

    if (!existsSync(configPath)) {
      if (existsSync(path.resolve(nameOrPath, '.hostmagic.json'))) {
        projectDir = path.resolve(nameOrPath);
        configPath = path.join(projectDir, '.hostmagic.json');
      } else {
        return {
          success: false,
          error: `Project directory or .hostmagic.json not found for "${nameOrPath}" at ${projectDir}`,
        };
      }
    }

    let config: HostmagicConfig;
    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(raw);
    } catch (err: any) {
      return { success: false, error: `Failed to read .hostmagic.json: ${err.message}` };
    }

    if (!config.services || config.services.length === 0) {
      return { success: false, error: `No services configured in .hostmagic.json for ${config.name}` };
    }

    const pKey = config.name.toLowerCase();

    // If already running under process manager, stop existing first to restart cleanly
    if (this.projectProcessManagers.has(pKey)) {
      const existing = this.projectProcessManagers.get(pKey);
      if (existing) {
        await existing.stopAll().catch(() => {});
      }
      this.projectProcessManagers.delete(pKey);
    }

    // Ensure host entries exist
    try {
      await ensureSystemHostsEntry();
      const domains = config.services.map((s) => s.domain);
      await syncHostsBlock(config.name, domains);
    } catch {}

    // Ensure dedicated ports
    let configNeedsSave = false;
    const invalidServices = config.services.filter(
      (s) => !s.port || s.port === 3000 || s.port === 3001 || s.port === 5173
    );
    if (invalidServices.length > 0) {
      const existingPorts = new Set(
        config.services
          .map((s) => s.port)
          .filter((p): p is number => !!p && p !== 3000 && p !== 3001 && p !== 5173)
      );
      for (const s of invalidServices) {
        const [newPort] = await allocateUniquePorts(1, Array.from(existingPorts));
        s.port = newPort;
        existingPorts.add(s.port);
        configNeedsSave = true;
      }
      if (configNeedsSave) {
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      }
    }

    // Clean locks and free occupied ports
    for (const s of config.services) {
      const serviceDir = path.join(projectDir, s.path || '.');
      await checkAndCleanNextLock(serviceDir, true);
      if (s.port) {
        await freePortIfOccupied(s.port, s.name);
      }
    }

    const ports = config.services.map((s) => s.port!);
    const frontendService = config.services.find((s) => s.type === 'frontend');
    const backendService = config.services.find((s) => s.type === 'backend');

    const frontendUrl = frontendService ? `http://${frontendService.domain}` : undefined;
    const backendUrl = backendService ? `http://${backendService.domain}` : undefined;

    const runtimeServices: ServiceRuntimeInfo[] = config.services.map((service, index) => {
      const internalPort = ports[index];
      const cleanUrl = `http://${service.domain}`;
      const env: Record<string, string> = {
        ...(service.customEnv || {}),
        PORT: String(internalPort),
      };

      if (service.portEnvVar && service.portEnvVar !== 'PORT') {
        env[service.portEnvVar] = String(internalPort);
      }

      if (service.type === 'frontend') {
        if (backendUrl) {
          env.NEXT_PUBLIC_API_URL = backendUrl;
          env.VITE_API_URL = backendUrl;
          env.REACT_APP_API_URL = backendUrl;
        }
        env.NEXT_PUBLIC_APP_URL = cleanUrl;
        env.VITE_APP_URL = cleanUrl;
        env.FAST_REFRESH = 'true';
        env.FORCE_COLOR = '1';
        env.NEXTAUTH_URL = 'http://localhost:3000';
        env.AUTH_URL = 'http://localhost:3000';
        env.AUTH_TRUST_HOST = 'true';
      } else if (service.type === 'backend') {
        env.APP_URL = cleanUrl;
        if (frontendUrl) {
          env.FRONTEND_URL = frontendUrl;
          env.CORS_ORIGIN = frontendUrl;
        }
      }

      return {
        service,
        port: internalPort,
        url: cleanUrl,
        env,
      };
    });

    const proxyRoutes = runtimeServices.map((s) => ({
      domain: s.service.domain,
      targetPort: s.port,
      serviceName: s.service.name,
      type: s.service.type,
    }));

    const frontendRuntime =
      runtimeServices.find((s) => s.service.type === 'frontend') ||
      (runtimeServices.length === 1 ? runtimeServices[0] : undefined);

    // Register routes with this gateway instance
    this.registerProject({
      name: config.name,
      routes: proxyRoutes,
      frontendPort: frontendRuntime?.port,
    });

    // Save in global registry
    await registerProjectInGlobalRegistry(config, projectDir).catch(() => {});

    // Create process manager and launch services
    const manager = new ProcessManager({
      quiet: !this.showProjectLogs,
      handleSignals: false,
    });
    manager.setGatewayPort(this.listeningPort);

    for (const info of runtimeServices) {
      await manager.startService(projectDir, info);
    }

    this.projectProcessManagers.set(pKey, manager);
    console.log(
      pc.green(
        `  ⚡ [GATEWAY] Started project '${config.name}' (${proxyRoutes.map((r) => r.domain).join(', ')})`
      )
    );
    return { success: true, project: config.name };
  }

  public async stopProjectByName(name: string): Promise<{
    success: boolean;
    stopped?: string;
    error?: string;
  }> {
    const pKey = name.toLowerCase().trim();
    const manager = this.projectProcessManagers.get(pKey);
    if (manager) {
      await manager.stopAll().catch(() => {});
      this.projectProcessManagers.delete(pKey);
      console.log(pc.yellow(`  🛑 [GATEWAY] Stopped project '${name}'`));
    }

    this.unregisterProject(name);
    return { success: true, stopped: name };
  }

  public async initProjectAtFolder(
    folderPath: string,
    suggestedDomain?: string
  ): Promise<{
    success: boolean;
    project?: string;
    path?: string;
    error?: string;
  }> {
    const resolvedPath = path.resolve(folderPath);
    if (!existsSync(resolvedPath)) {
      return { success: false, error: `Directory not found: ${resolvedPath}` };
    }

    const configPath = path.join(resolvedPath, '.hostmagic.json');
    if (existsSync(configPath)) {
      // Already has .hostmagic.json, load it, register it, sync hosts and start!
      try {
        const raw = await fs.readFile(configPath, 'utf-8');
        const config: HostmagicConfig = JSON.parse(raw);
        await registerProjectInGlobalRegistry(config, resolvedPath);
        if (config.services && config.services.length > 0) {
          try {
            await syncHostsBlock(
              config.name,
              config.services.map((s) => s.domain)
            );
          } catch {}
        }
        await this.startProjectByNameOrPath(config.name);
        return { success: true, project: config.name, path: resolvedPath };
      } catch (err: any) {
        return { success: false, error: `Failed to load existing .hostmagic.json: ${err.message}` };
      }
    }

    // Otherwise detect services and generate .hostmagic.json
    try {
      const cleanDomain = suggestedDomain ? suggestedDomain.split(':')[0].toLowerCase() : undefined;
      const tld = cleanDomain?.split('.').pop() || 'test';
      const defaultName = cleanDomain
        ? cleanDomain.split('.')[0]
        : path.basename(resolvedPath).toLowerCase().replace(/[^a-z0-9-]/g, '-');

      const detected = await detectServices(resolvedPath, defaultName, tld);
      const services: ServiceConfig[] = [];
      const assignedPorts = new Set<number>();

      if (detected.length === 0) {
        const [assignedPort] = await allocateUniquePorts(1, Array.from(assignedPorts));
        const domain = cleanDomain || `${defaultName}.${tld}`;
        services.push({
          name: 'web',
          path: '.',
          type: 'frontend',
          domain,
          command: 'npm run dev',
          port: assignedPort,
        });
      } else {
        for (let i = 0; i < detected.length; i++) {
          const s = detected[i];
          const serviceDir = path.join(resolvedPath, s.relativePath);
          await checkAndCleanNextLock(serviceDir, true);

          const [assignedPort] = await allocateUniquePorts(1, Array.from(assignedPorts));
          assignedPorts.add(assignedPort);

          // If suggestedDomain is provided and this is frontend (or first service), use suggestedDomain
          const serviceDomain =
            cleanDomain && (s.type === 'frontend' || i === 0)
              ? cleanDomain
              : s.suggestedDomain;

          services.push({
            name: s.name,
            path: s.relativePath,
            type: s.type,
            domain: serviceDomain,
            command: s.detectedCommand,
            port: assignedPort,
          });
        }
      }

      const config: HostmagicConfig = {
        $schema: 'https://raw.githubusercontent.com/hostmagic/cli/main/schema.json',
        name: defaultName,
        tld,
        services,
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      await registerProjectInGlobalRegistry(config, resolvedPath);

      try {
        await syncHostsBlock(
          config.name,
          config.services.map((s) => s.domain)
        );
      } catch {}

      await this.startProjectByNameOrPath(config.name);
      return { success: true, project: defaultName, path: resolvedPath };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to initialize project' };
    }
  }

  public registerRoute(domain: string, targetPort: number): void {
    const cleanDomain = domain.toLowerCase().trim();
    this.routes.set(cleanDomain, targetPort);
  }

  public resolveTargetDomain(req: http.IncomingMessage): string | undefined {
    const rawUrl = req.url || '/';
    const referer = (req.headers.referer || '').toLowerCase();
    const origin = (req.headers.origin || '').toLowerCase();

    // 0. Correlate with active OAuth flow state parameter (RFC 6749)
    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      const state = parsedUrl.searchParams.get('state');
      if (state && this.oauthStateCache.has(state)) {
        const item = this.oauthStateCache.get(state)!;
        if (Date.now() - item.timestamp < 300000) {
          return item.domain;
        } else {
          this.oauthStateCache.delete(state);
        }
      }

      // Query parameter overrides (?project=abc or ?domain=xyz)
      const paramProj = parsedUrl.searchParams.get('project');
      if (paramProj && this.projects.has(paramProj)) {
        const p = this.projects.get(paramProj);
        if (p && p.routes.length > 0) return p.routes[0].domain;
      }
    } catch {}

    // 1. Check Referer or Origin headers
    for (const project of this.projects.values()) {
      for (const route of project.routes) {
        if (
          (referer && referer.includes(route.domain.toLowerCase())) ||
          (origin && origin.includes(route.domain.toLowerCase()))
        ) {
          return route.domain;
        }
      }
    }

    // 2. Intuit by most recent OAuth initiation origin
    if (this.lastOAuthDomain && this.routes.has(this.lastOAuthDomain.toLowerCase())) {
      return this.lastOAuthDomain;
    }

    // 3. Intuit by explicitly selected project or cookie target
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/hostmagic_target=([^;]+)/);
    const cookieTarget = match ? match[1].trim() : undefined;
    const targetProjectName = cookieTarget || this.activeLocalhostTarget;
    if (targetProjectName && this.projects.has(targetProjectName)) {
      const p = this.projects.get(targetProjectName);
      if (p) {
        if (p.frontendPort) {
          const route = p.routes.find((r) => r.targetPort === p.frontendPort);
          if (route) return route.domain;
        }
        if (p.routes.length > 0) return p.routes[0].domain;
      }
    }

    // 4. Intuit by most recently active project browsed by developer
    if (this.lastActiveProject && this.projects.has(this.lastActiveProject)) {
      const p = this.projects.get(this.lastActiveProject);
      if (p) {
        if (p.frontendPort) {
          const route = p.routes.find((r) => r.targetPort === p.frontendPort);
          if (route) return route.domain;
        }
        if (p.routes.length > 0) return p.routes[0].domain;
      }
    }

    // 5. Default single active project domain
    return this.getDefaultProjectDomain();
  }

  private resolveLocalhostTarget(req: http.IncomingMessage): number | undefined {
    const rawUrl = req.url || '/';
    const referer = (req.headers.referer || '').toLowerCase();
    const origin = (req.headers.origin || '').toLowerCase();

    // 0. Intuitive port or project query parameter (e.g. ?port=58993 or ?project=abogando)
    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      const paramPort = parsedUrl.searchParams.get('port');
      const paramProj = parsedUrl.searchParams.get('project');
      if (paramPort) {
        const portNum = parseInt(paramPort, 10);
        if (!isNaN(portNum)) return portNum;
      }
      if (paramProj && this.projects.has(paramProj)) {
        const p = this.projects.get(paramProj);
        if (p?.frontendPort) return p.frontendPort;
      }
    } catch {
      // Ignored
    }

    // 1. Intuit by Referer / Origin header (from which domain the user clicked / redirected)
    for (const project of this.projects.values()) {
      for (const route of project.routes) {
        if (
          (referer && referer.includes(route.domain.toLowerCase())) ||
          (origin && origin.includes(route.domain.toLowerCase()))
        ) {
          if (project.frontendPort) return project.frontendPort;
        }
      }
    }

    // 2. Intuit by active OAuth initiation flow
    if (rawUrl.includes('/api/auth') || rawUrl.includes('/auth/callback')) {
      if (this.lastOAuthDomain) {
        for (const project of this.projects.values()) {
          if (
            project.routes.some(
              (r) => r.domain.toLowerCase() === this.lastOAuthDomain?.toLowerCase()
            )
          ) {
            if (project.frontendPort) return project.frontendPort;
          }
        }
      }
    }

    // 3. Check cookie override (hostmagic_target)
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/hostmagic_target=([^;]+)/);
    const cookieTarget = match ? match[1].trim() : undefined;

    if (cookieTarget && this.projects.has(cookieTarget)) {
      const p = this.projects.get(cookieTarget);
      if (p?.frontendPort) return p.frontendPort;
    }

    // 4. Check explicitly selected in-memory target
    if (this.activeLocalhostTarget && this.projects.has(this.activeLocalhostTarget)) {
      const p = this.projects.get(this.activeLocalhostTarget);
      if (p?.frontendPort) return p.frontendPort;
    }

    // 5. Intuit by most recently active project (the one the developer was browsing in tabs)
    if (this.lastActiveProject && this.projects.has(this.lastActiveProject)) {
      const p = this.projects.get(this.lastActiveProject);
      if (p?.frontendPort) return p.frontendPort;
    }

    // 6. If exactly 1 project is running with a frontend
    const activeProjects = Array.from(this.projects.values()).filter((p) => !!p.frontendPort);
    if (activeProjects.length === 1) {
      return activeProjects[0].frontendPort;
    }

    return undefined;
  }

  private getDefaultProjectDomain(): string | undefined {
    for (const p of this.projects.values()) {
      if (p.frontendPort) {
        const frontendRoute = p.routes.find((r) => r.targetPort === p.frontendPort);
        if (frontendRoute) return frontendRoute.domain;
        if (p.routes.length > 0) return p.routes[0].domain;
      }
    }
    return undefined;
  }

  private readJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }

  public renderGatewayHubHtml(): string {
    return this.renderSettingsDashboardHtml();
  }

  public renderSettingsDashboardHtml(): string {
    const allRoutes: Array<{
      domain: string;
      targetPort: number;
      projectName: string;
      serviceName: string;
      type: string;
    }> = [];

    for (const [pName, p] of this.projects.entries()) {
      for (const r of p.routes) {
        allRoutes.push({
          domain: r.domain,
          targetPort: r.targetPort,
          projectName: pName,
          serviceName: r.serviceName || r.domain.split('.')[0],
          type: r.type || (p.frontendPort === r.targetPort ? 'frontend' : 'custom'),
        });
      }
    }

    for (const [domain, port] of this.routes.entries()) {
      if (!allRoutes.some((r) => r.domain.toLowerCase() === domain.toLowerCase())) {
        allRoutes.push({
          domain,
          targetPort: port,
          projectName: 'standalone',
          serviceName: domain.split('.')[0],
          type: 'custom',
        });
      }
    }

    const initialJson = JSON.stringify(allRoutes).replace(/</g, '\\u003c');
    const projectCount = this.projects.size;
    const domainCount = allRoutes.length;

    const template = ReverseProxyServer.getDashboardTemplate();
    return template
      .replace(/\{\{INITIAL_JSON\}\}/g, initialJson)
      .replace(/\{\{DOMAIN_COUNT\}\}/g, String(domainCount))
      .replace(/\{\{PROJECT_COUNT\}\}/g, String(projectCount));
  }

  public static getDefaultDashboardTemplate(): string {
    return getDefaultDashboardTemplate();
  }

  public async renderNotFoundHtml(rawHost: string): Promise<string> {
    const cleanHost = (rawHost || '').split(':')[0].toLowerCase();

    let matchedProject: { name: string; path?: string; tld?: string } | undefined;
    try {
      const knownProjects = await getKnownProjects();
      matchedProject = knownProjects.find((p) => {
        if (p.services && p.services.some((s) => s.domain?.toLowerCase() === cleanHost)) {
          return true;
        }
        const baseName = cleanHost.split('.')[0];
        if (p.name && p.name.toLowerCase() === baseName) {
          return true;
        }
        const tld = p.tld || 'test';
        if (cleanHost === `${p.name?.toLowerCase()}.${tld}`) {
          return true;
        }
        return false;
      });
    } catch {}

    const safeHost = cleanHost
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const safeProjectName = matchedProject?.name
      ? matchedProject.name
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
      : '';

    const primaryIdeIds = ['antigravity', 'claude', 'codex', 'vscode', 'cursor', 'terminal'];
    const primaryIdes = SUPPORTED_IDES.filter((i) => primaryIdeIds.includes(i.id));
    const moreIdes = SUPPORTED_IDES.filter((i) => !primaryIdeIds.includes(i.id));

    const primaryButtonsHtml = primaryIdes
      .map(
        (ide) => `
        <button type="button" class="btn-ide primary-ide ide-item" data-search="${ide.name.toLowerCase()}" onclick="openInIde('${ide.id}', '${safeProjectName}', '${safeHost}')" title="${ide.name}">
          <span>${ide.name}</span>
        </button>`
      )
      .join('');

    const moreButtonsHtml = moreIdes
      .map(
        (ide) => `
        <button type="button" class="btn-ide more-ide-item ide-item" data-search="${ide.name.toLowerCase()}" onclick="openInIde('${ide.id}', '${safeProjectName}', '${safeHost}')" title="${ide.name}">
          <span>${ide.name}</span>
        </button>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hostmagic - ${matchedProject ? 'Route Inactive' : 'Host Not Found'}</title>
  <link rel="manifest" href="/__hostmagic/manifest.json" />
  <link rel="icon" type="image/webp" href="${getLogoDataUri()}" />
  <link rel="apple-touch-icon" href="${getLogoDataUri()}" />
  <meta name="theme-color" content="#121212" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Hostmagic" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #121212;
      --card-bg: #1e1e1e;
      --border: #333333;
      --border-focus: #78a9ff;
      --text-main: #f4f4f4;
      --text-sub: #a8a8a8;
      --text-dim: #6f6f6f;
      --primary: #0f62fe;
      --primary-hover: #0353e9;
      --secondary: #2c2c2c;
      --secondary-hover: #3d3d3d;
      --amber: #f1c21b;
      --amber-bg: rgba(241, 194, 27, 0.12);
      --red: #fa4d56;
      --red-bg: rgba(250, 77, 86, 0.12);
      --green: #42be65;
      --green-bg: rgba(66, 190, 101, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      background-image: radial-gradient(circle at 50% 20%, #1a1a24 0%, var(--bg) 80%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      max-width: 580px;
      width: 100%;
      padding: 36px 32px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      text-align: left;
    }
    .masthead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: #78a9ff;
      text-transform: uppercase;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.04em;
    }
    .badge.inactive {
      background: var(--amber-bg);
      color: var(--amber);
      border: 1px solid rgba(241, 194, 27, 0.3);
    }
    .badge.not-found {
      background: var(--red-bg);
      color: var(--red);
      border: 1px solid rgba(250, 77, 86, 0.3);
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .host-header {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 22px;
      font-weight: 600;
      color: var(--text-main);
      word-break: break-all;
      margin-bottom: 12px;
    }
    .desc {
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-sub);
      margin-bottom: 28px;
    }
    .desc strong {
      color: #ffffff;
    }
    .project-pill {
      font-family: 'IBM Plex Mono', monospace;
      background: #2a2a2a;
      border: 1px solid #444;
      padding: 2px 6px;
      color: #a6c8ff;
      font-size: 13px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      height: 44px;
      padding: 0 20px;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      width: 100%;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    .btn-secondary {
      background: var(--secondary);
      color: var(--text-main);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover:not(:disabled) {
      background: var(--secondary-hover);
      border-color: #555555;
    }
    .btn-ghost {
      background: transparent;
      color: #78a9ff;
      font-size: 13px;
      height: 36px;
      margin-top: 4px;
    }
    .btn-ghost:hover {
      text-decoration: underline;
      color: #a6c8ff;
    }
    .status-alert {
      margin-top: 18px;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.4;
      display: flex;
      align-items: center;
      gap: 10px;
      border-left: 3px solid transparent;
      background: #262626;
    }
    .status-alert.info {
      border-color: #0f62fe;
      color: #d0e2ff;
      background: rgba(15, 98, 254, 0.1);
    }
    .status-alert.success {
      border-color: var(--green);
      color: #defbe6;
      background: var(--green-bg);
    }
    .status-alert.error {
      border-color: var(--red);
      color: #fff1f1;
      background: var(--red-bg);
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .icon {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .ide-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
    .ide-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .ide-section-title {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--text-sub);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 0;
      white-space: nowrap;
    }
    .ide-search-wrap {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      max-width: 220px;
      min-width: 140px;
    }
    .ide-search-icon {
      position: absolute;
      left: 9px;
      pointer-events: none;
      color: #78a9ff;
      opacity: 0.7;
    }
    .ide-search-input {
      width: 100%;
      height: 30px;
      background: #181820;
      border: 1px solid #383844;
      border-radius: 4px;
      color: #f4f4f4;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 12px;
      padding: 0 10px 0 28px;
      outline: none;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }
    .ide-search-input:focus {
      border-color: #78a9ff;
      background: #1e1e28;
      box-shadow: 0 0 0 1px #78a9ff;
    }
    .ide-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    @media (max-width: 480px) {
      .ide-section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .ide-search-wrap {
        width: 100%;
        max-width: none;
      }
      .ide-grid {
        grid-template-columns: 1fr;
      }
    }
    .btn-ide {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 38px;
      padding: 0 12px;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-main);
      background: #24242c;
      border: 1px solid #383844;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn-ide:hover:not(:disabled) {
      background: #2f2f3a;
      border-color: #606076;
      color: #ffffff;
      transform: translateY(-1px);
    }
    .btn-ide:active:not(:disabled) {
      transform: translateY(0);
    }
    .btn-ide.primary-ide {
      background: #1e2638;
      border-color: #2e4474;
      color: #d0e2ff;
    }
    .btn-ide.primary-ide:hover:not(:disabled) {
      background: #263554;
      border-color: #4589ff;
      color: #ffffff;
    }
    .ide-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: transparent;
      border: 1px dashed #3a3a46;
      border-radius: 3px;
      padding: 9px 12px;
      color: #a8a8a8;
      font-size: 12px;
      font-family: 'IBM Plex Mono', monospace;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-top: 10px;
    }
    .ide-toggle-btn:hover {
      color: #ffffff;
      border-color: #78a9ff;
      background: rgba(120, 169, 255, 0.05);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="masthead">
      <div class="brand">
        <img src="${getLogoDataUri()}" alt="Hostmagic Logo" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; display: inline-block; vertical-align: middle;" onerror="this.onerror=null; this.src='/__hostmagic/magichost.webp';" />
        <span>Hostmagic Gateway</span>
      </div>
      ${
        matchedProject
          ? `<div class="badge inactive"><span class="badge-dot"></span>Route Inactive</div>`
          : `<div class="badge not-found"><span class="badge-dot"></span>Host Not Found</div>`
      }
    </div>

    <div class="host-header">${safeHost}</div>
    
    <p class="desc">
      ${
        matchedProject
          ? `This route belongs to project <span class="project-pill">${safeProjectName}</span>, but the development service is not currently running.`
          : `No active local service is currently configured for <strong>${safeHost}</strong>.`
      }
    </p>

    <div class="actions">
      ${
        matchedProject
          ? `<button id="btnStart" class="btn btn-primary" onclick="startRoute('${safeProjectName}')">
              <svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Start ${safeProjectName}
            </button>
            <button id="btnInit" class="btn btn-secondary" onclick="initFolder('${safeHost}')">
              <svg class="icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              Initialize / Link Folder (hm init)
            </button>`
          : `<button id="btnInit" class="btn btn-primary" onclick="initFolder('${safeHost}')">
              <svg class="icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Initialize Project Folder (hm init)
            </button>`
      }
      <a href="http://${HOSTMAGIC_SETTINGS_DOMAIN}" class="btn btn-ghost">
        ⚙ Open Hostmagic Settings Hub
      </a>
    </div>

    <div class="ide-section">
      <div class="ide-section-header">
        <div class="ide-section-title">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          <span>IDE / Terminal</span>
        </div>
        <div class="ide-search-wrap">
          <svg class="ide-search-icon" viewBox="0 0 24 24" width="13" height="13"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            id="ideSearchInput" 
            class="ide-search-input" 
            placeholder="Search IDE..." 
            oninput="filterIdes()" 
            autocomplete="off"
            spellcheck="false"
          />
        </div>
      </div>

      <div id="primaryIdeGrid" class="ide-grid">
        ${primaryButtonsHtml}
      </div>

      <button type="button" id="allIdesToggleBtn" class="ide-toggle-btn" onclick="toggleAllIdes()">
        <span>More IDEs &amp; Editors (${moreIdes.length}+)</span>
        <span id="allIdesToggleIcon">▾</span>
      </button>

      <div id="allIdesContainer" style="display: none; margin-top: 10px;">
        <div class="ide-grid">
          ${moreButtonsHtml}
        </div>
      </div>

      <div id="noIdesMatch" style="display: none; padding: 16px 12px; text-align: center; color: var(--text-dim); font-size: 12.5px; font-family: 'IBM Plex Mono', monospace;">
        No IDE matching search query.
      </div>
    </div>

    <div id="statusAlert" class="status-alert" style="display: none;"></div>
  </div>

  <script>
    const statusAlert = document.getElementById('statusAlert');
    const btnStart = document.getElementById('btnStart');
    const btnInit = document.getElementById('btnInit');

    function setButtonsDisabled(disabled) {
      if (btnStart) btnStart.disabled = disabled;
      if (btnInit) btnInit.disabled = disabled;
    }

    function showStatus(message, type, showSpinner = true) {
      if (!statusAlert) return;
      statusAlert.style.display = 'flex';
      statusAlert.className = 'status-alert ' + type;
      statusAlert.innerHTML = (showSpinner ? '<div class="spinner"></div>' : '') + '<div>' + message + '</div>';
    }

    function hideStatus() {
      if (!statusAlert) return;
      statusAlert.style.display = 'none';
      statusAlert.innerHTML = '';
    }

    async function startRoute(projectName) {
      setButtonsDisabled(true);
      showStatus('Starting services for <strong>' + projectName + '</strong>...', 'info', true);
      
      try {
        const res = await fetch('/__hostmagic/api/projects/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          showStatus('Services started! Connecting to route...', 'success', true);
          
          let attempts = 0;
          const maxAttempts = 20;
          const checkInterval = setInterval(async () => {
            attempts++;
            try {
              const ping = await fetch(window.location.href, { cache: 'no-store' });
              if (ping.status !== 404 && ping.status !== 502 && ping.status !== 503) {
                clearInterval(checkInterval);
                window.location.reload();
                return;
              }
            } catch {}
            if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              window.location.reload();
            }
          }, 600);
        } else {
          setButtonsDisabled(false);
          showStatus('Failed to start project: ' + (data.error || 'Unknown error'), 'error', false);
        }
      } catch (err) {
        setButtonsDisabled(false);
        showStatus('Error communicating with gateway: ' + err.message, 'error', false);
      }
    }

    async function openInIde(ideId, projectName, domain) {
      showStatus('Opening in <strong>' + ideId + '</strong>...', 'info', true);
      try {
        const res = await fetch('/__hostmagic/api/projects/open-ide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ide: ideId, name: projectName, domain: domain })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showStatus(data.message || 'Opened project in ' + ideId + '!', 'success', false);
          setTimeout(() => {
            hideStatus();
          }, 4500);
        } else if (data.needPath) {
          showStatus('Project folder not linked yet. Select project directory to link and open...', 'info', true);
          await initFolderAndOpen(domain, ideId);
        } else {
          showStatus('Could not open: ' + (data.error || data.message || 'Unknown error'), 'error', false);
        }
      } catch (err) {
        showStatus('Error communicating with gateway: ' + err.message, 'error', false);
      }
    }

    async function initFolderAndOpen(domain, ideId) {
      try {
        const res = await fetch('/__hostmagic/api/projects/init-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domain })
        });
        const data = await res.json();
        if (data.cancelled) {
          hideStatus();
          return;
        }
        if (res.ok && data.success) {
          showStatus('Folder linked! Launching <strong>' + ideId + '</strong>...', 'info', true);
          await openInIde(ideId, data.project || '', domain);
        } else {
          showStatus('Folder selection failed: ' + (data.error || 'Unknown error'), 'error', false);
        }
      } catch (err) {
        showStatus('Error during folder initialization: ' + err.message, 'error', false);
      }
    }

    function toggleAllIdes() {
      const container = document.getElementById('allIdesContainer');
      const toggleIcon = document.getElementById('allIdesToggleIcon');
      if (!container) return;
      const isHidden = container.style.display === 'none';
      container.style.display = isHidden ? 'block' : 'none';
      if (toggleIcon) toggleIcon.textContent = isHidden ? '▴' : '▾';
    }

    function filterIdes() {
      const input = document.getElementById('ideSearchInput');
      const query = (input?.value || '').toLowerCase().trim();
      const primaryGrid = document.getElementById('primaryIdeGrid');
      const allContainer = document.getElementById('allIdesContainer');
      const toggleBtn = document.getElementById('allIdesToggleBtn');
      const noMatch = document.getElementById('noIdesMatch');

      const primaryItems = primaryGrid ? primaryGrid.querySelectorAll('.ide-item') : [];
      const moreItems = allContainer ? allContainer.querySelectorAll('.ide-item') : [];

      if (!query) {
        primaryItems.forEach(el => el.style.display = 'inline-flex');
        moreItems.forEach(el => el.style.display = 'inline-flex');
        if (toggleBtn) toggleBtn.style.display = 'flex';
        const toggleIcon = document.getElementById('allIdesToggleIcon');
        if (toggleIcon && toggleIcon.textContent === '▾') {
          if (allContainer) allContainer.style.display = 'none';
        } else {
          if (allContainer) allContainer.style.display = 'block';
        }
        if (noMatch) noMatch.style.display = 'none';
        return;
      }

      if (toggleBtn) toggleBtn.style.display = 'none';
      if (allContainer) allContainer.style.display = 'block';

      let visibleCount = 0;
      primaryItems.forEach(el => {
        const searchTerms = (el.getAttribute('data-search') || '') + ' ' + (el.textContent || '').toLowerCase();
        const match = searchTerms.includes(query);
        el.style.display = match ? 'inline-flex' : 'none';
        if (match) visibleCount++;
      });

      moreItems.forEach(el => {
        const searchTerms = (el.getAttribute('data-search') || '') + ' ' + (el.textContent || '').toLowerCase();
        const match = searchTerms.includes(query);
        el.style.display = match ? 'inline-flex' : 'none';
        if (match) visibleCount++;
      });

      if (noMatch) {
        noMatch.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }

    async function initFolder(domain) {
      setButtonsDisabled(true);
      showStatus('Opening folder picker... Select project directory', 'info', true);
      
      try {
        const res = await fetch('/__hostmagic/api/projects/init-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domain })
        });
        const data = await res.json();
        
        if (data.cancelled) {
          setButtonsDisabled(false);
          hideStatus();
          return;
        }

        if (res.ok && data.success) {
          showStatus('Initialized project <strong>' + (data.project || '') + '</strong>! Starting services...', 'success', true);
          setTimeout(() => {
            window.location.reload();
          }, 1800);
        } else {
          setButtonsDisabled(false);
          showStatus('Initialization failed: ' + (data.error || 'Unknown error'), 'error', false);
        }
      } catch (err) {
        setButtonsDisabled(false);
        showStatus('Error during folder initialization: ' + err.message, 'error', false);
      }
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/__hostmagic/sw.js', { scope: '/' }).catch(() => {});
      });
    }
  </script>
</body>
</html>`;
  }

  public async start(port: number = 80, oauthPort: number = 3000): Promise<void> {
    this.listeningPort = port;

    // 1. Start primary reverse proxy (default: port 80)
    await new Promise<void>((resolve, reject) => {
      this.server.listen(port, '0.0.0.0', () => {
        resolve();
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(
            new Error(
              `Port ${port} is already in use by another application. ` +
              `Ensure no other web server (such as IIS, Apache or Skype) is using port ${port}.`
            )
          );
        } else if (err.code === 'EACCES' || err.code === 'EPERM') {
          const isUnix = process.platform === 'darwin' || process.platform === 'linux';
          const hint = isUnix
            ? `\n👉 On Linux and macOS, binding to port ${port} requires elevated privileges.\n` +
              `   Run with sudo: sudo hm dev (or sudo hostmagic dev)\n` +
              (process.platform === 'linux'
                ? `   Or allow Node to bind privileged ports without sudo:\n` +
                  `   sudo setcap 'cap_net_bind_service=+ep' $(which node)\n`
                : '')
            : '';
          reject(
            new Error(`Permission denied binding to port ${port}.${hint}`)
          );
        } else {
          reject(err);
        }
      });
    });

    // 2. Start auxiliary OAuth Callback Bridge (default: port 3000) to catch localhost:3000 redirects
    if (oauthPort && oauthPort !== port) {
      this.oauthBridgeServer = http.createServer(this.oauthBridgeRequestHandler);
      this.oauthBridgeServer.on('upgrade', this.upgradeHandler);

      await new Promise<void>((resolve) => {
        this.oauthBridgeServer!.listen(oauthPort, '0.0.0.0', () => {
          resolve();
        });

        this.oauthBridgeServer!.on('error', (err: any) => {
          // If port 3000 is occupied, don't crash the main gateway - just disable the auxiliary bridge
          if (err.code === 'EADDRINUSE') {
            this.oauthBridgeServer = undefined;
          }
          resolve();
        });
      });
    }
  }

  public async stop(): Promise<void> {
    for (const manager of this.projectProcessManagers.values()) {
      await manager.stopAll().catch(() => {});
    }
    this.projectProcessManagers.clear();

    return new Promise((resolve) => {
      this.proxy.close();
      if (this.oauthBridgeServer) {
        try {
          this.oauthBridgeServer.close(() => {});
        } catch {}
        this.oauthBridgeServer = undefined;
      }
      this.server.close(() => {
        resolve();
      });
    });
  }

  // --- Static Gateway Discovery and Client Helpers ---

  public static async isGatewayRunning(port: number = 80): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(
        `http://127.0.0.1:${port}/__hostmagic/status`,
        { timeout: 600 },
        (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed?.hostmagic === true);
              } catch {
                resolve(false);
              }
            });
          } else {
            resolve(false);
          }
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  public static async registerWithGateway(
    port: number = 80,
    project: ProjectRegistration
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = JSON.stringify(project);
      const req = http.request(
        `http://127.0.0.1:${port}/__hostmagic/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  }

  public static async unregisterFromGateway(
    port: number = 80,
    projectName: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = JSON.stringify({ name: projectName });
      const req = http.request(
        `http://127.0.0.1:${port}/__hostmagic/unregister`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  }
}

