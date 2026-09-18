import * as p from '@clack/prompts';
import pc from 'picocolors';
import { openHostsFile, getHostsPath, type OpenHostsFileOptions } from '../core/hosts.js';

export interface HostfileCommandOptions {
  editor?: string;
}

export async function hostfileCommand(options?: HostfileCommandOptions): Promise<void> {
  const hostsPath = getHostsPath();

  p.intro(`${pc.bgMagenta(pc.bold(' 📝 Hostmagic Hosts File '))}`);
  p.log.info(`Hosts file location: ${pc.cyan(hostsPath)}`);

  try {
    const result = await openHostsFile({ editor: options?.editor });
    p.outro(pc.green(`✨ Opened hosts file using ${pc.bold(result.editor)}.`));
  } catch (err: any) {
    p.log.error(err.message || String(err));
    process.exit(1);
  }
}
