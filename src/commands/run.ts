import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { allocateUniquePorts } from '../core/port.js';
import { ProcessManager } from '../core/process-manager.js';
import { ReverseProxyServer } from '../core/proxy.js';
import {
  freePortIfOccupied,
  checkAndCleanNextLock,
  detectPreferredPort,
} from '../core/port-killer.js';
import type { HostmagicConfig, ServiceRuntimeInfo } from '../types.js';

export async function runCommand(): Promise<void> {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, '.hostmagic.json');

  if (!existsSync(configPath)) {
    console.error(
      pc.red(
        'Error: .hostmagic.json not found in current directory. Run `hostmagic init` first.'
      )
    );
    process.exit(1);
  }

  let config: HostmagicConfig;
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(raw);
  } catch (err: any) {
    console.error(pc.red(`Error reading .hostmagic.json: ${err.message}`));
    process.exit(1);
  }

  if (!config.services || config.services.length === 0) {
    console.error(pc.red('No services configured in .hostmagic.json.'));
    process.exit(1);
  }

  // Ensure every service has a persistent dedicated random port (never standard 3000/3001)
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
      console.log(pc.green(`✨ Migrated services to dedicated random ports in .hostmagic.json.`));
    }
  }

  console.log(pc.cyan(`\n🪄 Configuring clean .${config.tld || 'test'} domains for ${config.name}...`));

  // Check if an existing Hostmagic Gateway is already running on port 80
  const isGatewayActive = await ReverseProxyServer.isGatewayRunning(80);

  if (!isGatewayActive) {
    // Ensure port 80 (Reverse Proxy) is available or offer to kill foreign occupant
    const port80Ok = await freePortIfOccupied(80, 'Reverse Proxy');
    if (!port80Ok) {
      console.error(pc.red('\nAborted: Port 80 is required for Hostmagic Reverse Proxy.'));
      process.exit(1);
    }
  }

  // Ensure each service port is free, and clean any Next.js locks
  for (const s of config.services) {
    const serviceDir = path.join(rootDir, s.path);
    // 1. Clear any Next.js dev server lock/process
    await checkAndCleanNextLock(serviceDir);

    // 2. Free assigned port if occupied
    if (s.port) {
      await freePortIfOccupied(s.port, s.name);
    }
  }

  // 1. Use the dedicated ports assigned to each service
  const ports = config.services.map((s) => s.port!);

  // 2. Identify frontend and backend services for cross URLs (no ports in URLs)
  const frontendService = config.services.find((s) => s.type === 'frontend');
  const backendService = config.services.find((s) => s.type === 'backend');

  const frontendUrl = frontendService ? `http://${frontendService.domain}` : undefined;
  const backendUrl = backendService ? `http://${backendService.domain}` : undefined;

  // 3. Prepare runtime info and environment variables for each service
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
      // Zero-config OAuth bypass: NextAuth uses localhost:3000 to comply with Google Cloud Console
      env.NEXTAUTH_URL = 'http://localhost:3000';
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

  // 4. Initialize or register with the Reverse Proxy Gateway on port 80
  const proxyRoutes = runtimeServices.map((s) => ({
    domain: s.service.domain,
    targetPort: s.port,
  }));
  const frontendRuntime = runtimeServices.find((s) => s.service.type === 'frontend');

  let proxyServer: ReverseProxyServer | undefined;

  if (isGatewayActive) {
    console.log(pc.green('✨ Connected to active Hostmagic Gateway on port 80.'));
    await ReverseProxyServer.registerWithGateway(80, {
      name: config.name,
      routes: proxyRoutes,
      frontendPort: frontendRuntime?.port,
    });
  } else {
    proxyServer = new ReverseProxyServer({
      name: config.name,
      routes: proxyRoutes,
      frontendPort: frontendRuntime?.port,
    });
    try {
      await proxyServer.start(80);
    } catch (err: any) {
      console.error(
        pc.red(`\n❌ Failed to start reverse proxy on port 80: ${err.message}`)
      );
      process.exit(1);
    }
  }

  // 5. Initialize Process Manager and register shutdown hooks
  const manager = new ProcessManager();
  manager.onStop(async () => {
    if (proxyServer) {
      await proxyServer.stop();
    } else {
      await ReverseProxyServer.unregisterFromGateway(80, config.name);
    }
  });

  // 6. Print beautiful banner with clean URLs and OAuth info
  printBanner(config.name, runtimeServices, isGatewayActive);

  // 7. Start concurrent child processes
  for (const info of runtimeServices) {
    await manager.startService(rootDir, info);
  }

  await manager.waitForAll();
}

function printBanner(projectName: string, services: ServiceRuntimeInfo[], isGatewayClient?: boolean): void {
  const line = '─'.repeat(64);
  console.log(pc.magenta(`┌${line}┐`));
  console.log(
    pc.magenta(`│`) +
    pc.bold(`  🚀 Hostmagic is running clean domains for [${pc.cyan(projectName)}]`) +
    ' '.repeat(Math.max(0, 62 - (43 + projectName.length))) +
    pc.magenta(`│`)
  );
  console.log(pc.magenta(`├${line}┤`));

  for (const info of services) {
    const role =
      info.service.type === 'frontend'
        ? pc.cyan('[FRONTEND]')
        : info.service.type === 'backend'
        ? pc.magenta('[BACKEND] ')
        : pc.yellow('[CUSTOM]  ');

    const entry = `  • ${role} ${pc.bold(info.service.name)}: ${pc.underline(pc.green(info.url))}`;
    console.log(
      pc.magenta(`│`) + entry + ' '.repeat(Math.max(0, 73 - (info.service.name.length + info.url.length))) + pc.magenta(`│`)
    );
  }

  if (services.some((s) => s.service.type === 'frontend')) {
    const oauth = `  • ${pc.blue('[OAUTH]   ')} ${pc.bold('localhost')}: ${pc.underline(pc.green('http://localhost'))} ${pc.dim('(Google/OAuth origin)')}`;
    console.log(
      pc.magenta(`│`) + oauth + ' '.repeat(Math.max(0, 73 - (9 + 16 + 23))) + pc.magenta(`│`)
    );
  }

  console.log(pc.magenta(`├${line}┤`));
  const proxyMsg = isGatewayClient
    ? '  ⚡ Joined shared Port 80 Gateway (multi-project concurrent mode) '
    : '  ⚡ Port 80 Gateway active (multi-project concurrent reverse proxy)';
  console.log(
    pc.magenta(`│`) +
    pc.dim(proxyMsg) +
    ' '.repeat(Math.max(0, 64 - proxyMsg.length)) +
    pc.magenta(`│`)
  );
  console.log(
    pc.magenta(`│`) +
    pc.dim('  Press ESC or Ctrl+C at any time to gracefully stop all services. ') +
    pc.magenta(`│`)
  );
  console.log(pc.magenta(`└${line}┘\n`));
}
