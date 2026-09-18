import http from 'node:http';
import httpProxy from 'http-proxy';
import pc from 'picocolors';

export interface ProxyRoute {
  domain: string;
  targetPort: number;
}

export interface ProjectRegistration {
  name: string;
  routes: ProxyRoute[];
  frontendPort?: number;
}

export class ReverseProxyServer {
  private server: http.Server;
  private proxy: httpProxy;
  private routes: Map<string, number> = new Map();
  private projects: Map<string, ProjectRegistration> = new Map();
  private activeLocalhostTarget?: string;
  private listeningPort = 80;
  private oauthSyncCache: Map<
    string,
    { cookies: string[]; targetUrl: string; originDomain: string; timestamp: number }
  > = new Map();
  private lastOAuthDomain?: string;
  private lastActiveProject?: string;

  constructor(initialProject?: ProjectRegistration) {
    this.proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      xfwd: true,
      ws: true,
    });

    if (initialProject) {
      this.registerProject(initialProject);
    }

    // Intercept responses for OAuth URL rewriting and Session Cookie Synchronization
    this.proxy.on('proxyRes', (proxyRes, req, res) => {
      const rawHost = req.headers.host || '';
      const host = rawHost.split(':')[0].toLowerCase();
      const location = proxyRes.headers['location'];

      // 1. Rewrite outgoing OAuth initiation redirects (e.g. accounts.google.com)
      if (location && (location.includes('accounts.google.com') || location.includes('/oauth'))) {
        if (host && (host.endsWith('.test') || host.endsWith('.local'))) {
          this.lastOAuthDomain = host;
        }

        try {
          const parsed = new URL(location);
          const redirectUri = parsed.searchParams.get('redirect_uri');
          if (redirectUri && (redirectUri.includes('.test') || redirectUri.includes('.local'))) {
            const rewrittenUri = redirectUri.replace(
              /http:\/\/[^/]+\.(test|local)/g,
              'http://localhost:3000'
            );
            parsed.searchParams.set('redirect_uri', rewrittenUri);
            proxyRes.headers['location'] = parsed.toString();
          }
        } catch {
          proxyRes.headers['location'] = location.replace(
            /http%3A%2F%2F[^%]+?\.(test|local)/gi,
            'http%3A%2F%2Flocalhost%3A3000'
          );
        }
      }

      // 2. Intercept incoming OAuth callback responses on localhost to sync session cookies
      const isLocalhost = host === 'localhost' || host === '127.0.0.1';
      const isOAuthCallback =
        req.url?.includes('/api/auth/callback') || req.url?.includes('/auth/callback');

      if (isLocalhost && isOAuthCallback) {
        const targetDomain = this.lastOAuthDomain || this.getDefaultProjectDomain();

        if (targetDomain) {
          const rawCookies = proxyRes.headers['set-cookie'];
          if (rawCookies && rawCookies.length > 0) {
            const syncId = (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2));
            const targetLocation = proxyRes.headers['location'] || '/';

            this.oauthSyncCache.set(syncId, {
              cookies: Array.isArray(rawCookies) ? rawCookies : [rawCookies],
              targetUrl: targetLocation,
              originDomain: targetDomain,
              timestamp: Date.now(),
            });

            // Clean up stale sync cache items older than 2 minutes
            const now = Date.now();
            for (const [key, item] of this.oauthSyncCache.entries()) {
              if (now - item.timestamp > 120000) {
                this.oauthSyncCache.delete(key);
              }
            }

            // Redirect browser to the target domain to install the session cookies on that origin!
            proxyRes.headers['location'] = `http://${targetDomain}/__hostmagic_oauth_sync?syncId=${syncId}`;
            delete proxyRes.headers['set-cookie'];
          }
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

    const requestHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
      const rawHost = req.headers.host || '';
      const host = rawHost.split(':')[0].toLowerCase();
      const url = req.url || '/';

      // 0. OAuth Session Cookie Synchronization Endpoint
      if (url.startsWith('/__hostmagic_oauth_sync')) {
        try {
          const parsedUrl = new URL(url, `http://${rawHost}`);
          const syncId = parsedUrl.searchParams.get('syncId');
          if (syncId && this.oauthSyncCache.has(syncId)) {
            const syncData = this.oauthSyncCache.get(syncId)!;
            this.oauthSyncCache.delete(syncId);

            // Sanitize cookies for local HTTP development:
            // Remove '; Secure' so browser doesn't discard them over HTTP
            // Remove '; Domain=...' so they bind directly to the current origin
            const cleanCookies = syncData.cookies.map((c) =>
              c.replace(/;\s*secure/gi, '').replace(/;\s*domain=[^;]+/gi, '')
            );

            res.writeHead(302, {
              Location: syncData.targetUrl || '/',
              'Set-Cookie': cleanCookies,
              'Cache-Control': 'no-store',
            });
            res.end();
            return;
          }
        } catch {
          // Fallthrough if parsing fails
        }
      }

      // 1. Internal Hostmagic Gateway Control Endpoints
      if (url === '/__hostmagic' || url === '/__hostmagic/' || url === '/__hostmagic/hub') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderGatewayHubHtml());
        return;
      }

      if (url.startsWith('/__hostmagic/')) {
        if (url === '/__hostmagic/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              hostmagic: true,
              version: '1.0.0',
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
          } catch {
            // Bad payload
          }
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
          } catch {
            // Bad payload
          }
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
      }

      // 2. Localhost & 127.0.0.1 routing (for OAuth callback & manual visits)
      if (host === 'localhost' || host === '127.0.0.1') {
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

        this.proxy.web(req, res, {
          target: `http://127.0.0.1:${targetPort}`,
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderNotFoundHtml(rawHost));
      }
    };

    this.server = http.createServer(requestHandler);

    // WebSocket support for Hot Module Reloading (Vite, Next.js, Astro)
    const upgradeHandler = (req: http.IncomingMessage, socket: any, head: Buffer) => {
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

    this.server.on('upgrade', upgradeHandler);
  }

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

  private renderGatewayHubHtml(): string {
    const projectList = Array.from(this.projects.values());
    const projectCards = projectList
      .map((p) => {
        const domainLinks = p.routes
          .map(
            (r) =>
              `<a href="http://${r.domain}" target="_blank" style="color: #38bdf8; text-decoration: none; margin-right: 12px; font-weight: 500;">
                🌐 ${r.domain} <span style="color: #64748b; font-size: 0.85em;">(:${r.targetPort})</span>
              </a>`
          )
          .join('');

        const selectButton = p.frontendPort
          ? `<a href="/__hostmagic/select-target?project=${encodeURIComponent(p.name)}" 
                style="background: #8b5cf6; color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.85em; font-weight: 600;">
                Set as localhost OAuth target
             </a>`
          : '';

        return `
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px 24px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 1.15rem; font-weight: 700; color: #f1f5f9; margin-bottom: 6px;">
                🚀 ${p.name}
              </div>
              <div>${domainLinks}</div>
            </div>
            <div>${selectButton}</div>
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Hostmagic Gateway</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 40px;">
          <div style="max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #c084fc; margin-bottom: 8px;">🧙‍♂️ Hostmagic Gateway</h1>
              <p style="color: #94a3b8; font-size: 1.05rem;">
                Multiple fullstack projects are running concurrently without port collisions.
              </p>
            </div>
            <div>${projectCards || '<p style="color: #64748b; text-align: center;">No projects currently registered.</p>'}</div>
            <div style="margin-top: 32px; text-align: center; color: #64748b; font-size: 0.85rem;">
              Listening on port 80 &bull; Hostmagic Local Reverse Proxy
            </div>
          </div>
        </body>
      </html>
    `;
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

  public async start(port: number = 80): Promise<void> {
    this.listeningPort = port;

    return new Promise((resolve, reject) => {
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
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.proxy.close();
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

