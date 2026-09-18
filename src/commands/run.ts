import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { allocateUniquePorts } from '../core/port.js';
import { ProcessManager } from '../core/process-manager.js';
import { ReverseProxyServer } from '../core/proxy.js';
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

  console.log(pc.cyan(`\n🪄 Configuring clean .local domains (no ports) for ${config.name}...`));

  // 1. Allocate unique ephemeral internal ports for child processes
  const ports = await allocateUniquePorts(config.services.length);

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

  // 4. Initialize and start the built-in Reverse Proxy on port 80
  const proxyRoutes = runtimeServices.map((s) => ({
    domain: s.service.domain,
    targetPort: s.port,
  }));

  const proxy = new ReverseProxyServer(proxyRoutes);
  try {
    await proxy.start(80);
  } catch (err: any) {
    console.error(
      pc.red(`\n❌ Failed to start reverse proxy on port 80: ${err.message}`)
    );
    process.exit(1);
  }

  // 5. Initialize Process Manager and register shutdown hooks
  const manager = new ProcessManager();
  manager.onStop(async () => {
    await proxy.stop();
  });

  // 6. Print beautiful banner with clean URLs
  printBanner(config.name, runtimeServices);

  // 7. Start concurrent child processes
  for (const info of runtimeServices) {
    await manager.startService(rootDir, info);
  }

  await manager.waitForAll();
}

function printBanner(projectName: string, services: ServiceRuntimeInfo[]): void {
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

  console.log(pc.magenta(`├${line}┤`));
  console.log(
    pc.magenta(`│`) +
    pc.dim('  ⚡ Port 80 Reverse Proxy active (no port numbers needed in browser)') +
    pc.magenta(`│`)
  );
  console.log(
    pc.magenta(`│`) +
    pc.dim('  Press Ctrl+C at any time to gracefully stop all services.     ') +
    pc.magenta(`│`)
  );
  console.log(pc.magenta(`└${line}┘\n`));
}
