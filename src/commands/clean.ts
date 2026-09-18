import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { clearHostsBlock } from '../core/hosts.js';
import type { HostmagicConfig } from '../types.js';

export interface CleanOptions {
  all?: boolean;
  yes?: boolean;
}

export async function cleanCommand(options: CleanOptions): Promise<void> {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, '.hostmagic.json');

  let projectName: string | undefined;

  if (options.all) {
    projectName = '*';
  } else if (existsSync(configPath)) {
    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      const config: HostmagicConfig = JSON.parse(raw);
      projectName = config.name;
    } catch {
      // Ignored
    }
  }

  p.intro(`${pc.bgMagenta(pc.bold(' 🧹 Hostmagic Clean '))}`);

  // Safety confirmation when wiping ALL projects across the entire system
  if (options.all && !options.yes) {
    p.log.warn(
      pc.yellow(
        pc.bold('⚠️  CAUTION: You are about to remove ALL Hostmagic entries across ALL projects from your system hosts file!')
      )
    );

    const confirmed = await p.confirm({
      message: 'Are you sure you want to proceed and wipe all Hostmagic entries?',
      initialValue: false,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Clean operation cancelled. Your hosts file was not modified.');
      process.exit(0);
    }
  }

  const spinner = p.spinner();
  const targetDesc = options.all
    ? 'all Hostmagic entries'
    : projectName
    ? `entries for [${projectName}]`
    : 'default Hostmagic entries';

  spinner.start(`Removing ${targetDesc} from system hosts file (UAC elevation may appear in Windows)...`);

  try {
    await clearHostsBlock(projectName);
    spinner.stop(`Successfully cleaned ${targetDesc} from hosts file.`);
    p.outro(pc.green('✨ Hosts file is clean and DNS cache has been flushed.'));
  } catch (err: any) {
    spinner.stop(pc.red('Failed to clean hosts file.'));
    p.log.error(err.message || String(err));
    process.exit(1);
  }
}
