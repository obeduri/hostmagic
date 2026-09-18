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
            if (redirectUri && (redirectUri.includes('.test') || redirectUri.includes('.local'))) {
              const rewrittenUri = redirectUri.replace(
                /http:\/\/[^/]+\.(test|local)/g,
                'http://localhost:3000'
              );
              parsed.searchParams.set('redirect_uri', rewrittenUri);
              proxyRes.headers['location'] = parsed.toString();
            }
          } catch {
            if (location.includes('.test') || location.includes('.local')) {
              proxyRes.headers['location'] = location.replace(
                /http%3A%2F%2F[^%]+?\.(test|local)/gi,
                'http%3A%2F%2Flocalhost%3A3000'
              );
            }
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

    // Track active OAuth origin when auth initiation request arrives on a project domain
    if (url.includes('/api/auth') || url.includes('/auth/')) {
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        this.lastOAuthDomain = host;
        for (const [pName, p] of this.projects.entries()) {
          if (p.routes.some((r) => r.domain === host)) {
            this.lastActiveProject = pName;
            break;
          }
        }
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
            version: '1.0.3',
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

