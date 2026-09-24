import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execa } from 'execa';
import pc from 'picocolors';
import { ReverseProxyServer, type ProjectRegistration } from '../core/proxy.js';
import { ensureSystemHostsEntry, syncHostsBlock } from '../core/hosts.js';
import { flushDnsCache } from '../core/dns.js';
import { freePortIfOccupied } from '../core/port-killer.js';
import { registerProjectInGlobalRegistry } from '../core/registry.js';
import type { HostmagicConfig } from '../types.js';

export interface StartCommandOptions {
  port?: string | number;
  oauthPort?: string | number;
  open?: boolean;
  showProjectLogs?: boolean;
}

export async function openBrowser(url: string): Promise<void> {
  try {
    if (process.platform === 'win32') {
      const child = execa('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        cleanup: false,
      });
      child.unref();
    } else if (process.platform === 'darwin') {
      const child = execa('open', [url], {
        detached: true,
        stdio: 'ignore',
        cleanup: false,
      });
      child.unref();
    } else {
      const child = execa('xdg-open', [url], {
        detached: true,
        stdio: 'ignore',
        cleanup: false,
      });
      child.unref();
    }
  } catch {
    // Non-fatal if browser cannot be launched
  }
}

function stripAnsi(str: string): string {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function padBannerLine(content: string, width = 64): string {
  const visibleLength = stripAnsi(content).length;
  const padding = Math.max(0, width - visibleLength);
  return pc.magenta('│') + content + ' '.repeat(padding) + pc.magenta('│');
}

function printStartBanner(
  port: number,
  oauthPort?: number,
  project?: ProjectRegistration
): void {
  const line = '─'.repeat(64);
  console.log(pc.magenta(`\n┌${line}┐`));
  console.log(padBannerLine(`  🪄 Hostmagic Gateway & Settings Server`));
  console.log(pc.magenta(`├${line}┤`));

  const settingsUrl = port === 80 ? 'http://hostmagic.settings' : `http://hostmagic.settings:${port}`;
  const settingsEntry = `  • ${pc.cyan('[SETTINGS]')} ${pc.bold('hostmagic.settings')}: ${pc.underline(pc.green(settingsUrl))}`;
  console.log(padBannerLine(settingsEntry));

  if (oauthPort) {
    const oauthUrl = `http://localhost:${oauthPort}`;
    const oauthEntry = `  • ${pc.blue('[OAUTH]   ')} ${pc.bold(`localhost:${oauthPort}`)}: ${pc.underline(pc.green(oauthUrl))} ${pc.dim('(OAuth Bridge)')}`;
    console.log(padBannerLine(oauthEntry));
  }

  const localUrl = port === 80 ? 'http://localhost' : `http://localhost:${port}`;
  const localEntry = `  • ${pc.yellow('[GATEWAY] ')} ${pc.bold(`localhost:${port}`)}: ${pc.underline(pc.green(localUrl))} ${pc.dim('(Reverse Proxy)')}`;
  console.log(padBannerLine(localEntry));

  if (project && project.routes.length > 0) {
    console.log(pc.magenta(`├${line}┤`));
    console.log(padBannerLine(`  📦 Preloaded Project: ${pc.cyan(project.name)}`));
    for (const route of project.routes) {
      const routeUrl = port === 80 ? `http://${route.domain}` : `http://${route.domain}:${port}`;
      const routeEntry = `    ↳ ${pc.bold(route.serviceName || route.domain)}: ${pc.underline(pc.green(routeUrl))}`;
      console.log(padBannerLine(routeEntry));
    }
  }

  console.log(pc.magenta(`├${line}┤`));
  console.log(padBannerLine(pc.dim('  ⚡ Central Gateway active (listening for multi-project traffic)')));
  console.log(padBannerLine(pc.dim('  Ready to route any project started with `hm dev`.')));
  console.log(padBannerLine(pc.dim('  Press ESC or Ctrl+C at any time to gracefully stop the server.')));
  console.log(pc.magenta(`└${line}┘\n`));
}

export async function startCommand(options?: StartCommandOptions): Promise<void> {
  const port = options?.port ? parseInt(String(options.port), 10) || 80 : 80;
  const oauthPort = options?.oauthPort ? parseInt(String(options.oauthPort), 10) || 3000 : 3000;

  // 1. Ensure hostmagic.settings is registered in system hosts and flush DNS cache
  try {
    await ensureSystemHostsEntry();
    await flushDnsCache();
  } catch {
    // Non-fatal if elevated permissions not granted immediately
  }

  // 2. Check if a Hostmagic Gateway is already running on the requested port
  const isGatewayActive = await ReverseProxyServer.isGatewayRunning(port);

  if (isGatewayActive) {
    const rootDir = process.cwd();
    const configPath = path.join(rootDir, '.hostmagic.json');
    let registeredProjectName: string | undefined;

    if (existsSync(configPath)) {
      try {
        const raw = await fs.readFile(configPath, 'utf-8');
        const config: HostmagicConfig = JSON.parse(raw);
        if (config.services && config.services.length > 0) {
          const proxyRoutes = config.services
            .filter((s) => !!s.port)
            .map((s) => ({
              domain: s.domain,
              targetPort: s.port!,
              serviceName: s.name,
              type: s.type,
            }));
          const frontendRuntime = config.services.find((s) => s.type === 'frontend');
          await ReverseProxyServer.registerWithGateway(port, {
            name: config.name,
            routes: proxyRoutes,
            frontendPort: frontendRuntime?.port,
          });
          registeredProjectName = config.name;
          await registerProjectInGlobalRegistry(config, rootDir).catch(() => {});
          try {
            await syncHostsBlock(config.name, proxyRoutes.map((r) => r.domain));
          } catch {}
        }
      } catch {}
    }

    console.log(pc.green(`\n✨ Hostmagic Gateway is already active and running on port ${port}.`));
    if (registeredProjectName) {
      console.log(pc.cyan(`  ✔ Synchronized active routes for [${registeredProjectName}].`));
    }
    const settingsUrl = port === 80 ? 'http://hostmagic.settings' : `http://hostmagic.settings:${port}`;
    console.log(
      pc.bold(
        pc.green(`  ✔ Settings dashboard: ${pc.underline(pc.cyan(settingsUrl))}\n`)
      )
    );

    if (options?.open) {
      await openBrowser(settingsUrl);
    }
    return;
  }

  // 3. Ensure port 80 and OAuth port 3000 are available or offer to free them
  const portOk = await freePortIfOccupied(port, 'Hostmagic Gateway / Reverse Proxy');
  if (!portOk) {
    console.error(pc.red(`\nAborted: Port ${port} is required for Hostmagic Gateway.`));
    process.exit(1);
  }

  if (oauthPort && oauthPort !== port) {
    await freePortIfOccupied(oauthPort, 'OAuth Callback Bridge');
  }

  // 4. Check if current directory has a project config to preload
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, '.hostmagic.json');
  let initialProject: ProjectRegistration | undefined;

  if (existsSync(configPath)) {
    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      const config: HostmagicConfig = JSON.parse(raw);
      if (config.services && config.services.length > 0) {
        const proxyRoutes = config.services
          .filter((s) => !!s.port)
          .map((s) => ({
            domain: s.domain,
            targetPort: s.port!,
            serviceName: s.name,
            type: s.type,
          }));
        const frontendRuntime = config.services.find((s) => s.type === 'frontend');
        initialProject = {
          name: config.name,
          routes: proxyRoutes,
          frontendPort: frontendRuntime?.port,
        };
        await registerProjectInGlobalRegistry(config, rootDir).catch(() => {});
        try {
          await syncHostsBlock(config.name, proxyRoutes.map((r) => r.domain));
        } catch {}
      }
    } catch {}
  }

  // 5. Initialize and start the ReverseProxyServer
  const proxyServer = new ReverseProxyServer(initialProject, {
    showProjectLogs: options?.showProjectLogs,
  });
  try {
    await proxyServer.start(port, oauthPort);
  } catch (err: any) {
    console.error(
      pc.red(`\n❌ Failed to start Hostmagic Gateway on port ${port}: ${err.message}`)
    );
    process.exit(1);
  }

  // 6. Print status banner
  printStartBanner(port, oauthPort, initialProject);

  const settingsUrl = port === 80 ? 'http://hostmagic.settings' : `http://hostmagic.settings:${port}`;
  if (options?.open) {
    await openBrowser(settingsUrl);
  }

  // 7. Setup graceful termination handlers
  let isShuttingDown = false;
  const stopServer = async (signal?: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      } catch {}
    }

    console.log(`\n\n${pc.yellow(`🛑 Received ${signal || 'stop signal'}, stopping Hostmagic Gateway...`)}`);
    await proxyServer.stop();
    console.log(pc.green('✔ Hostmagic Gateway stopped gracefully.\n'));
    process.exit(0);
  };

  process.on('SIGINT', () => stopServer('SIGINT'));
  process.on('SIGTERM', () => stopServer('SIGTERM'));
  process.on('SIGHUP', () => stopServer('SIGHUP'));

  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      process.stdin.on('keypress', (_str, key) => {
        if (key.name === 'escape') {
          stopServer('ESC');
        } else if (key.ctrl && key.name === 'c') {
          stopServer('SIGINT');
        }
      });
    } catch {}
  }

  // Keep server running indefinitely until terminated
  await new Promise<void>(() => {});
}
