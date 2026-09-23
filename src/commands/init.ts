import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectServices } from '../core/detector.js';
import { syncHostsBlock, isElevated } from '../core/hosts.js';
import { allocateUniquePorts } from '../core/port.js';
import { registerProjectInGlobalRegistry } from '../core/registry.js';
import {
  detectPreferredPort,
  freePortIfOccupied,
  checkAndCleanNextLock,
  findProcessOnPort,
} from '../core/port-killer.js';
import type { HostmagicConfig, ServiceConfig } from '../types.js';

interface InitOptions {
  yes?: boolean;
  name?: string;
  tld?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const rootDir = process.cwd();
  const folderName = path.basename(rootDir).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const tld = options.tld || 'test';

  p.intro(`${pc.bgMagenta(pc.bold(' 🧙‍♂️ Hostmagic Init '))}`);

  // Check for existing .hostmagic.json to preserve existing ports
  const configPath = path.join(rootDir, '.hostmagic.json');
  let existingConfig: HostmagicConfig | null = null;
  if (existsSync(configPath)) {
    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      existingConfig = JSON.parse(raw);
    } catch {}
  }

  // 1. Confirm Project Name
  let projectName = options.name || existingConfig?.name || folderName;
  if (!options.yes) {
    const response = await p.text({
      message: `Project name (will be used for .${tld} domains):`,
      defaultValue: projectName,
      placeholder: projectName,
      validate(val) {
        if (!val || !/^[a-z0-9-]+$/.test(val)) {
          return 'Project name must only contain lowercase alphanumeric characters and hyphens.';
        }
      },
    });

    if (p.isCancel(response)) {
      p.cancel('Initialization cancelled.');
      process.exit(0);
    }
    projectName = response as string;
  }

  // 2. Scan and Detect Services
  const spinner = p.spinner();
  spinner.start('Scanning repository for services (frontend, backend, or standalone)...');

  const detected = await detectServices(rootDir, projectName, tld);
  spinner.stop(`Found ${detected.length} service(s).`);

  if (detected.length === 0) {
    p.log.warn(
      `No services or package.json found in current directory or standard subdirectories (frontend/, backend/, apps/).`
    );
  }

  const services: ServiceConfig[] = [];
  const assignedPorts = new Set<number>();

  // Determine dedicated port for each service and check for port conflicts
  for (let i = 0; i < detected.length; i++) {
    const s = detected[i];
    const serviceDir = path.join(rootDir, s.relativePath);

    // Clean any orphaned Next.js locks from previous runs
    await checkAndCleanNextLock(serviceDir, options.yes);

    const existingService = existingConfig?.services?.find((item) => item.name === s.name);
    // Only reuse an existing port if it is a dedicated port (never 3000/3001/5173)
    const hasValidExistingPort =
      existingService?.port &&
      existingService.port >= 1024 &&
      existingService.port !== 3000 &&
      existingService.port !== 3001 &&
      existingService.port !== 5173;

    let assignedPort: number;

    if (hasValidExistingPort && !assignedPorts.has(existingService!.port!)) {
      const preferredPort = existingService!.port!;
      const occupant = await findProcessOnPort(preferredPort);
      if (occupant) {
        // Port is occupied, offer user to terminate the process
        const freed = await freePortIfOccupied(preferredPort, s.name, options.yes);
        if (freed) {
          assignedPort = preferredPort;
        } else {
          const [fallback] = await allocateUniquePorts(1, Array.from(assignedPorts));
          assignedPort = fallback;
        }
      } else {
        assignedPort = preferredPort;
      }
    } else {
      // Allocate fresh unique random port in range 40000-65535 so projects never collide
      const [fallback] = await allocateUniquePorts(1, Array.from(assignedPorts));
      assignedPort = fallback;
    }

    assignedPorts.add(assignedPort);

    p.log.message(
      `${pc.bold(s.type === 'frontend' ? pc.cyan('[FRONTEND]') : s.type === 'backend' ? pc.magenta('[BACKEND]') : pc.yellow('[CUSTOM]'))} ${pc.bold(s.name)}:\n` +
      `  • Path:    ${pc.dim(s.relativePath)}\n` +
      `  • Command: ${pc.green(s.detectedCommand)}\n` +
      `  • Domain:  ${pc.blue(s.suggestedDomain)}\n` +
      `  • Port:    ${pc.yellow(assignedPort)}`
    );

    services.push({
      name: s.name,
      path: s.relativePath,
      type: s.type,
      domain: s.suggestedDomain,
      command: s.detectedCommand,
      port: assignedPort,
    });
  }

  // 3. Confirm or Customize
  if (!options.yes && services.length > 0) {
    const confirm = await p.confirm({
      message: 'Do you want to save this configuration and configure hosts?',
      initialValue: true,
    });

    if (p.isCancel(confirm) || !confirm) {
      p.cancel('Initialization cancelled.');
      process.exit(0);
    }
  }

  // 4. Persist .hostmagic.json
  const config: HostmagicConfig = {
    $schema: 'https://raw.githubusercontent.com/hostmagic/cli/main/schema.json',
    name: projectName,
    tld,
    services,
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  p.log.success(`Configuration saved to ${pc.cyan('.hostmagic.json')}`);

  // Register in central Hostmagic project registry
  await registerProjectInGlobalRegistry(config, rootDir).catch(() => {});

  // 5. Update hosts file
  const domains = services.map((s) => s.domain);
  if (domains.length > 0) {
    const elevated = await isElevated();
    const isWindows = process.platform === 'win32';

    if (!elevated && !isWindows) {
      p.log.info(
        pc.cyan('Elevated permissions required for /etc/hosts. Sudo password prompt will appear below:')
      );
    }

    let hostsSpinner: any;
    if (elevated || isWindows) {
      hostsSpinner = p.spinner();
      const elevationMsg = isWindows && !elevated ? ' (UAC elevation dialog will appear)...' : '...';
      hostsSpinner.start(`Updating system hosts file${elevationMsg}`);
    }

    try {
      await syncHostsBlock(projectName, domains);
      if (hostsSpinner) {
        hostsSpinner.stop(`System hosts file updated with ${domains.length} domain(s).`);
      } else {
        p.log.success(`System hosts file updated with ${domains.length} domain(s).`);
      }
    } catch (err: any) {
      if (hostsSpinner) {
        hostsSpinner.stop(pc.red('Failed to update hosts file automatically.'));
      }
      p.log.error(err.message || String(err));
      p.log.info(
        pc.yellow('You can add the following entries manually to your hosts file:\n') +
        domains.map((d) => `127.0.0.1  ${d}`).join('\n')
      );
    }
  }

  p.outro(
    `${pc.green('🎉 Hostmagic successfully initialized!')} Run ${pc.bold(pc.cyan('hostmagic dev'))} or ${pc.bold(pc.cyan('hm dev'))} to start your services.`
  );
}
