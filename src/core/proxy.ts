import http from 'node:http';
import httpProxy from 'http-proxy';
import pc from 'picocolors';
import { syncHostsBlock, HOSTMAGIC_SETTINGS_DOMAIN } from './hosts.js';

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
            version: '1.0.8',
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
            version: '1.0.8',
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
      this.proxy.ws(req, socket, head, {
        target: `ws://127.0.0.1:${targetPort}`,
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
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hostmagic Settings & Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #07090e;
      --card-bg: rgba(15, 23, 42, 0.75);
      --card-border: rgba(51, 65, 85, 0.6);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #a855f7;
      --primary-hover: #9333ea;
      --primary-glow: rgba(168, 85, 247, 0.25);
      --cyan: #38bdf8;
      --cyan-glow: rgba(56, 189, 248, 0.2);
      --emerald: #10b981;
      --rose: #f43f5e;
      --amber: #fbbf24;
      --dialog-bg: #0d1321;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.08) 0px, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      padding: 40px 24px;
      line-height: 1.5;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-icon {
      font-size: 2.2rem;
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(56, 189, 248, 0.2));
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 14px;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-title h1 {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #f8fafc, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-title p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 2px;
    }

    .domain-badge {
      font-size: 0.75rem;
      background: rgba(168, 85, 247, 0.15);
      color: #d8b4fe;
      border: 1px solid rgba(168, 85, 247, 0.3);
      padding: 2px 8px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      letter-spacing: normal;
      -webkit-text-fill-color: #d8b4fe;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #7c3aed);
      color: white;
      box-shadow: 0 4px 14px var(--primary-glow);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-hover), #6d28d9);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--primary-glow);
    }

    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      color: var(--text);
      border: 1px solid var(--card-border);
    }

    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.8);
      border-color: #64748b;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 0.2s;
    }

    .metric-card:hover {
      border-color: rgba(168, 85, 247, 0.4);
    }

    .metric-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }

    .metric-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: var(--emerald);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--emerald);
      animation: pulse-dot 2s infinite;
      display: inline-block;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    /* Main Table Card */
    .table-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }

    .table-header-bar {
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      border-bottom: 1px solid var(--card-border);
      background: rgba(15, 23, 42, 0.5);
    }

    .table-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-input {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 8px 14px;
      color: var(--text);
      font-size: 0.85rem;
      width: 260px;
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }

    /* Table styling */
    .table-responsive {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    th {
      background: rgba(30, 41, 59, 0.5);
      padding: 12px 20px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.3);
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(30, 41, 59, 0.35);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge-project {
      background: rgba(148, 163, 184, 0.12);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }

    .badge-frontend {
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .badge-backend {
      background: rgba(192, 132, 252, 0.12);
      color: #c084fc;
      border: 1px solid rgba(192, 132, 252, 0.3);
    }

    .badge-custom {
      background: rgba(251, 191, 36, 0.12);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    .badge-status-live {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .domain-link {
      color: var(--cyan);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: color 0.15s;
    }

    .domain-link:hover {
      color: #7dd3fc;
      text-decoration: underline;
    }

    .port-tag {
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
      font-size: 0.85rem;
      background: rgba(15, 23, 42, 0.6);
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid rgba(51, 65, 85, 0.4);
    }

    .action-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-action {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }

    .btn-logs {
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.25);
    }

    .btn-logs:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
    }

    .btn-delete {
      background: rgba(244, 63, 94, 0.1);
      color: #f43f5e;
      border-color: rgba(244, 63, 94, 0.25);
    }

    .btn-delete:hover {
      background: rgba(244, 63, 94, 0.2);
      border-color: #f43f5e;
    }

    /* Native HTML Dialogs */
    dialog {
      background: var(--dialog-bg);
      color: var(--text);
      border: 1px solid rgba(71, 85, 105, 0.8);
      border-radius: 14px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      max-width: 860px;
      width: 92vw;
      margin: auto;
      padding: 0;
      position: fixed;
      inset: 0;
      overflow: hidden;
    }

    dialog::backdrop {
      background: rgba(3, 7, 18, 0.75);
      backdrop-filter: blur(6px);
    }

    .dialog-header {
      padding: 18px 24px;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .dialog-header h3 {
      font-size: 1.15rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #f8fafc;
    }

    .dialog-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dialog-close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.3rem;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .dialog-close-btn:hover {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
    }

    .dialog-body {
      padding: 24px;
    }

    /* Terminal Output */
    .terminal-container {
      background: #030712;
      border: 1px solid #1e293b;
      border-radius: 8px;
      height: 480px;
      overflow-y: auto;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      color: #e2e8f0;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .terminal-container::-webkit-scrollbar {
      width: 8px;
    }

    .terminal-container::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }

    .terminal-empty {
      color: #64748b;
      text-align: center;
      margin-top: 180px;
      font-style: italic;
    }

    /* Form Fields */
    .form-group {
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .form-control {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--text);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }

    .dialog-footer {
      padding: 16px 24px;
      background: rgba(15, 23, 42, 0.8);
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid var(--primary);
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      pointer-events: none;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">🧙‍♂️</div>
        <div class="brand-title">
          <h1>
            Hostmagic Settings
            <span class="domain-badge">hostmagic.settings</span>
          </h1>
          <p>🧙‍♂️ Hostmagic Gateway &bull; Universal Reverse Proxy &bull; Port 80 &bull; Realtime Domain Hub</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="loadRoutes(true)">
          🔄 Refresh
        </button>
        <button class="btn btn-primary" onclick="openAddModal()">
          ➕ Add Domain / Service
        </button>
      </div>
    </header>

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Active Domains</div>
        <div class="metric-value">
          <span id="metricDomains">{{DOMAIN_COUNT}}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Running Projects</div>
        <div class="metric-value">
          <span id="metricProjects">{{PROJECT_COUNT}}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Reverse Proxy Engine</div>
        <div class="metric-value">
          <span class="live-dot"></span> Port 80
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">OAuth 2.0 Bridge</div>
        <div class="metric-value" style="font-size: 1.1rem; color: #38bdf8;">
          localhost:3000
        </div>
      </div>
    </div>

    <!-- Main Table Card -->
    <div class="table-card">
      <div class="table-header-bar">
        <div class="table-title">
          🌐 Registered Services & Routing Table
        </div>
        <input 
          type="text" 
          id="searchInput" 
          class="search-input" 
          placeholder="Filter by domain, name, or port..." 
          oninput="filterTable()"
        />
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Service</th>
              <th>Domain</th>
              <th>Internal Port</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="routesTableBody">
            <!-- Dynamically populated -->
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- HTML5 Native Dialog for Logs -->
  <dialog id="logModal">
    <div class="dialog-header">
      <h3>
        📋 Logs: <span id="logModalTarget" style="color: var(--cyan);">service</span>
        <span class="badge badge-status-live" style="margin-left: 8px;">
          <span class="live-dot"></span> Live
        </span>
      </h3>
      <div class="dialog-controls">
        <label style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; cursor: pointer;">
          <input type="checkbox" id="autoScrollToggle" checked /> Auto-scroll
        </label>
        <button id="copyLogsBtn" class="btn-action btn-logs" onclick="copyLogsToClipboard()">
          📋 Copy Logs
        </button>
        <button class="btn-action btn-logs" onclick="clearTerminalView()">
          🧹 Clear View
        </button>
        <button class="dialog-close-btn" onclick="closeLogModal()">✕</button>
      </div>
    </div>
    <div class="dialog-body">
      <div id="terminalOutput" class="terminal-container"></div>
    </div>
  </dialog>

  <!-- HTML5 Native Dialog for Adding Domain/Service -->
  <dialog id="addModal">
    <div class="dialog-header">
      <h3>➕ Register New Domain / Service</h3>
      <button class="dialog-close-btn" onclick="closeAddModal()">✕</button>
    </div>
    <div class="dialog-body">
      <div class="form-group">
        <label for="addProject">Project Name</label>
        <input type="text" id="addProject" class="form-control" placeholder="e.g. reparando" />
      </div>
      <div class="form-group">
        <label for="addService">Service Name</label>
        <input type="text" id="addService" class="form-control" placeholder="e.g. web, api, docs" />
      </div>
      <div class="form-group">
        <label for="addDomain">Domain Name (will resolve on port 80)</label>
        <input type="text" id="addDomain" class="form-control" placeholder="e.g. admin.reparando.test" />
      </div>
      <div class="form-group">
        <label for="addPort">Internal Target Port</label>
        <input type="number" id="addPort" class="form-control" placeholder="e.g. 5173, 4000" />
      </div>
      <div class="form-group">
        <label for="addType">Service Role</label>
        <select id="addType" class="form-control">
          <option value="frontend">Frontend Application</option>
          <option value="backend">Backend API</option>
          <option value="custom" selected>Custom Service</option>
        </select>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary" onclick="closeAddModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitNewRoute()">Register Domain</button>
    </div>
  </dialog>

  <!-- Toast Element -->
  <div id="toast" class="toast"></div>

  <script>
    let allRoutes = {{INITIAL_JSON}};
    let activeLogTarget = null;
    let logInterval = null;

    function cleanAnsi(str) {
      if (!str) return '';
      return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function renderTable(routesToRender) {
      const tbody = document.getElementById('routesTableBody');
      if (!routesToRender || routesToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 32px;">No active domains found.</td></tr>';
        return;
      }

      tbody.innerHTML = routesToRender.map(r => {
        const typeClass = r.type === 'frontend' ? 'badge-frontend' : (r.type === 'backend' ? 'badge-backend' : 'badge-custom');
        return \`
          <tr>
            <td><span class="badge badge-project">📦 \${escapeHtml(r.projectName)}</span></td>
            <td style="font-weight: 600; color: #f1f5f9;">\${escapeHtml(r.serviceName)}</td>
            <td>
              <a href="http://\${encodeURIComponent(r.domain)}" target="_blank" class="domain-link">
                🌐 \${escapeHtml(r.domain)} <span style="font-size: 0.8em;">↗</span>
              </a>
            </td>
            <td><span class="port-tag">:\${r.targetPort}</span></td>
            <td><span class="badge \${typeClass}">\${escapeHtml((r.type || 'custom').toUpperCase())}</span></td>
            <td><span class="badge badge-status-live"><span class="live-dot"></span> LIVE</span></td>
            <td>
              <div class="action-group">
                <button class="btn-action btn-logs" onclick="openLogModal('\${escapeHtml(r.domain)}', '\${escapeHtml(r.serviceName)}')">
                  📜 Logs
                </button>
                <button class="btn-action btn-delete" onclick="deleteRoute('\${escapeHtml(r.domain)}', '\${escapeHtml(r.projectName)}')">
                  🗑️ Remove
                </button>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function filterTable() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      if (!q) {
        renderTable(allRoutes);
        return;
      }
      const filtered = allRoutes.filter(r =>
        r.domain.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        String(r.targetPort).includes(q)
      );
      renderTable(filtered);
    }

    async function loadRoutes(showNotice) {
      try {
        const res = await fetch('/__hostmagic/api/status');
        if (res.ok) {
          const data = await res.json();
          allRoutes = data.routes || [];
          document.getElementById('metricDomains').textContent = allRoutes.length;
          document.getElementById('metricProjects').textContent = (data.projects || []).length;
          filterTable();
          if (showNotice) showToast('Routes updated');
        }
      } catch (err) {
        console.error('Failed to fetch routes', err);
      }
    }

    // Modal Logs
    const logModal = document.getElementById('logModal');
    logModal.addEventListener('close', () => {
      if (logInterval) {
        clearInterval(logInterval);
        logInterval = null;
      }
      activeLogTarget = null;
    });

    function openLogModal(domain, serviceName) {
      activeLogTarget = domain;
      document.getElementById('logModalTarget').textContent = domain + (serviceName ? ' (' + serviceName + ')' : '');
      document.getElementById('terminalOutput').innerHTML = '<div class="terminal-empty">Connecting to live log stream...</div>';
      logModal.showModal();
      fetchLogs();
      logInterval = setInterval(fetchLogs, 1200);
    }

    function closeLogModal() {
      logModal.close();
    }

    function clearTerminalView() {
      document.getElementById('terminalOutput').innerHTML = '<div class="terminal-empty">Log view cleared. Waiting for new output...</div>';
    }

    async function copyLogsToClipboard() {
      const terminal = document.getElementById('terminalOutput');
      const text = terminal ? terminal.textContent : '';
      if (!text || text.includes('Connecting to live log stream...') || text.includes('No logs recorded yet') || text.includes('Log view cleared.')) {
        showToast('No logs to copy');
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        const btn = document.getElementById('copyLogsBtn');
        const origText = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        btn.style.borderColor = '#34d399';
        btn.style.color = '#34d399';
        showToast('Logs copied to clipboard!');
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      } catch (err) {
        showToast('Failed to copy logs');
      }
    }

    async function fetchLogs() {
      if (!activeLogTarget) return;
      try {
        const res = await fetch('/__hostmagic/api/logs?target=' + encodeURIComponent(activeLogTarget));
        if (res.ok) {
          const data = await res.json();
          const terminal = document.getElementById('terminalOutput');
          if (data.logs && data.logs.length > 0) {
            const shouldScroll = document.getElementById('autoScrollToggle').checked;
            terminal.textContent = data.logs.map(cleanAnsi).join('\\n');
            if (shouldScroll) {
              terminal.scrollTop = terminal.scrollHeight;
            }
          } else {
            terminal.innerHTML = '<div class="terminal-empty">No logs recorded yet for ' + escapeHtml(activeLogTarget) + '</div>';
          }
        }
      } catch (err) {
        // Ignored
      }
    }

    // Modal Add
    const addModal = document.getElementById('addModal');
    function openAddModal() {
      addModal.showModal();
    }

    function closeAddModal() {
      addModal.close();
    }

    async function submitNewRoute() {
      const project = document.getElementById('addProject').value.trim() || 'custom';
      const service = document.getElementById('addService').value.trim() || 'service';
      const domain = document.getElementById('addDomain').value.trim();
      const port = parseInt(document.getElementById('addPort').value.trim(), 10);
      const type = document.getElementById('addType').value;

      if (!domain || isNaN(port) || port <= 0) {
        alert('Please enter a valid domain and internal port.');
        return;
      }

      try {
        const res = await fetch('/__hostmagic/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: project,
            serviceName: service,
            domain: domain,
            targetPort: port,
            type: type
          })
        });

        if (res.ok) {
          closeAddModal();
          showToast('Domain ' + domain + ' successfully registered!');
          document.getElementById('addDomain').value = '';
          document.getElementById('addPort').value = '';
          await loadRoutes();
        } else {
          alert('Failed to register domain. Check server logs.');
        }
      } catch (err) {
        alert('Error connecting to Hostmagic gateway.');
      }
    }

    async function deleteRoute(domain, projectName) {
      if (!confirm('Are you sure you want to remove domain ' + domain + ' from Hostmagic reverse proxy?')) {
        return;
      }

      try {
        const res = await fetch('/__hostmagic/api/routes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain, projectName })
        });

        if (res.ok) {
          showToast('Domain ' + domain + ' removed');
          await loadRoutes();
        } else {
          alert('Failed to delete route.');
        }
      } catch (err) {
        alert('Error communicating with Hostmagic gateway.');
      }
    }

    // Initial table render
    renderTable(allRoutes);
  </script>
</body>
</html>`;
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

