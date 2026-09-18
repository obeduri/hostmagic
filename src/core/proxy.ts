import http from 'node:http';
import httpProxy from 'http-proxy';
import pc from 'picocolors';

export interface ProxyRoute {
  domain: string;
  targetPort: number;
}

export class ReverseProxyServer {
  private server: http.Server;
  private proxy: httpProxy;
  private routes: Map<string, number> = new Map();
  private listeningPort = 80;

  constructor(routes: ProxyRoute[]) {
    for (const route of routes) {
      this.registerRoute(route.domain, route.targetPort);
    }

    this.proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      xfwd: true,
      ws: true,
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
            <body style="font-family: system-ui, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center;">
              <h1 style="color: #c084fc;">🧙‍♂️ Hostmagic Gateway</h1>
              <p style="font-size: 1.2rem;">Service <strong>${host}</strong> is starting up on internal port <code>${targetPort || 'unknown'}</code>...</p>
              <p style="color: #94a3b8;">Please refresh in a few seconds.</p>
            </body>
          </html>
        `);
      }
    });

    this.server = http.createServer((req, res) => {
      const rawHost = req.headers.host || '';
      const host = rawHost.split(':')[0].toLowerCase();

      const targetPort = this.routes.get(host);
      if (targetPort) {
        this.proxy.web(req, res, {
          target: `http://127.0.0.1:${targetPort}`,
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(
          `Hostmagic: No service configured for host "${rawHost}".\n` +
          `Configured hosts: ${Array.from(this.routes.keys()).join(', ')}`
        );
      }
    });

    // WebSocket support for Hot Module Reloading (Vite, Next.js, Astro)
    this.server.on('upgrade', (req, socket, head) => {
      const rawHost = req.headers.host || '';
      const host = rawHost.split(':')[0].toLowerCase();

      const targetPort = this.routes.get(host);
      if (targetPort) {
        this.proxy.ws(req, socket, head, {
          target: `ws://127.0.0.1:${targetPort}`,
        });
      } else {
        socket.destroy();
      }
    });
  }

  public registerRoute(domain: string, targetPort: number): void {
    const cleanDomain = domain.toLowerCase().trim();
    this.routes.set(cleanDomain, targetPort);
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
        } else if (err.code === 'EACCES') {
          reject(
            new Error(
              `Permission denied binding to port ${port}. ` +
              `On Linux/macOS, ports below 1024 require elevated privileges (sudo).`
            )
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
}
