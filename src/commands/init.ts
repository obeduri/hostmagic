import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectServices } from '../core/detector.js';
import { syncHostsBlock } from '../core/hosts.js';
import type { HostmagicConfig, ServiceConfig } from '../types.js';

interface InitOptions {
  yes?: boolean;
  name?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const rootDir = process.cwd();
  const folderName = path.basename(rootDir).toLowerCase().replace(/[^a-z0-9-]/g, '-');

  p.intro(`${pc.bgMagenta(pc.bold(' 🧙‍♂️ Hostmagic Init '))}`);

  // 1. Confirm Project Name
  let projectName = options.name || folderName;
  if (!options.yes) {
    const response = await p.text({
      message: 'Project name (will be used for local domains):',
      defaultValue: folderName,
      placeholder: folderName,
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
  spinner.start('Scanning repository for frontend and backend services...');

  const detected = await detectServices(rootDir, projectName);
  spinner.stop(`Found ${detected.length} service(s).`);

  if (detected.length === 0) {
    p.log.warn(
      `No standard frontend or backend directories found (e.g. frontend/, backend/, apps/web/, apps/api/).`
    );
  }

  const services: ServiceConfig[] = [];

  // Show summary of detected services
  for (const s of detected) {
    p.log.message(
      `${pc.bold(s.type === 'frontend' ? pc.cyan('[FRONTEND]') : s.type === 'backend' ? pc.magenta('[BACKEND]') : pc.yellow('[CUSTOM]'))} ${pc.bold(s.name)}:\n` +
      `  • Path:    ${pc.dim(s.relativePath)}\n` +
      `  • Command: ${pc.green(s.detectedCommand)}\n` +
      `  • Domain:  ${pc.blue(s.suggestedDomain)}`
    );

    services.push({
      name: s.name,
      path: s.relativePath,
      type: s.type,
      domain: s.suggestedDomain,
      command: s.detectedCommand,
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
  const configPath = path.join(rootDir, '.hostmagic.json');
  const config: HostmagicConfig = {
    $schema: 'https://raw.githubusercontent.com/hostmagic/cli/main/schema.json',
    name: projectName,
    tld: 'local',
    services,
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  p.log.success(`Configuration saved to ${pc.cyan('.hostmagic.json')}`);

  // 5. Update hosts file
  const domains = services.map((s) => s.domain);
  if (domains.length > 0) {
    const hostsSpinner = p.spinner();
    hostsSpinner.start('Updating system hosts file (UAC elevation may appear in Windows)...');

    try {
      await syncHostsBlock(projectName, domains);
      hostsSpinner.stop(`System hosts file updated with ${domains.length} domain(s).`);
    } catch (err: any) {
      hostsSpinner.stop(pc.red('Failed to update hosts file automatically.'));
      p.log.error(err.message || String(err));
      p.log.info(
        pc.yellow('You can add the following entries manually to your hosts file:\n') +
        domains.map((d) => `127.0.0.1  ${d}`).join('\n')
      );
    }
  }

  p.outro(
    `${pc.green('🎉 Hostmagic successfully initialized!')} Run ${pc.bold(pc.cyan('hostmagic run'))} to start your services.`
  );
}
