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
import type {
  HostmagicConfig,
  DashboardProjectInfo,
  ServiceRuntimeInfo,
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

export class ReverseProxyServer {
  private server: http.Server;
  private oauthBridgeServer?: http.Server;
  private proxy: httpProxy;
  private routes: Map<string, number> = new Map();
  private projects: Map<string, ProjectRegistration> = new Map();
  private projectProcessManagers: Map<string, ProcessManager> = new Map();
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

  constructor(initialProject?: ProjectRegistration) {
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
    });

    // Error handler for proxy errors (e.g. backend service still spinning up)
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
            version: '1.0.9',
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
            version: '1.0.9',
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

      // Transparent HMR & Fast Refresh Support for Next.js, Vite, and Astro:
      // When dev servers (Next.js 14.2+, Next.js 15, Vite, etc.) receive HMR requests
      // (like /_next/webpack-hmr, /_next/hmr, or dev polling), they check the Origin header.
      // If Origin is http://my-app.test while the internal server is on localhost:PORT,
      // Next.js blocks the request with:
      // "Blocked cross-origin request to Next.js dev resource /_next/hmr from my-app.test"
      // By normalizing the Origin to match the internal target (or same-origin to host),
      // dev servers recognize the request as same-origin, guaranteeing 100% reliable Fast Refresh!
      const isDevResource =
        url.startsWith('/_next/') ||
        url.startsWith('/@vite') ||
        url.startsWith('/__vite') ||
        url.startsWith('/_astro') ||
        url.includes('webpack-hmr') ||
        url.includes('hot-update') ||
        url.includes('hmr');

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
        if (req.headers.origin) {
          req.headers.origin = `http://127.0.0.1:${targetPort}`;
        }
      }

      this.proxy.web(req, res, {
        target: `http://127.0.0.1:${targetPort}`,
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(this.renderNotFoundHtml(rawHost));
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

      // Normalize Origin for WebSocket HMR (Next.js Fast Refresh, Vite HMR, Astro HMR)
      // When the browser connects from http://<app>.test, Next.js 14/15 and Vite WebSocket
      // servers check whether Origin matches the internal listening address.
      // Normalizing Origin ensures HMR WebSockets are never blocked by cross-origin checks!
      if (req.headers.origin) {
        req.headers.origin = `http://127.0.0.1:${targetPort}`;
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
    const manager = new ProcessManager();
    manager.setGatewayPort(this.listeningPort);

    for (const info of runtimeServices) {
      await manager.startService(projectDir, info);
    }

    this.projectProcessManagers.set(pKey, manager);
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
    }

    this.unregisterProject(name);
    return { success: true, stopped: name };
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

  private renderNotFoundHtml(rawHost: string): string {
    const configured = Array.from(this.routes.keys()).join(', ');
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Hostmagic - Not Found</title></head>
        <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #0b0f19; color: #f8fafc; text-align: center;">
          <h1 style="color: #f43f5e;">❌ Host Not Found</h1>
          <p style="font-size: 1.1rem;">No service is configured for <strong>${rawHost}</strong>.</p>
          <p style="color: #94a3b8;">Active routes: <code>${configured || 'none'}</code></p>
        </body>
      </html>
    `;
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

