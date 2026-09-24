import pc from 'picocolors';
import {
  isAutostartEnabled,
  enableAutostart,
  disableAutostart,
  getAutostartStatus,
} from '../core/autostart.js';

export interface AutostartCommandOptions {
  enable?: boolean;
  disable?: boolean;
  status?: boolean;
}

export async function autostartCommand(options?: AutostartCommandOptions): Promise<void> {
  if (options?.enable) {
    const result = await enableAutostart();
    if (result.success) {
      console.log(pc.green('✔ Hostmagic configured to start automatically on Operating System boot.'));
    } else {
      console.error(pc.red(`✖ Failed to enable OS startup: ${result.error}`));
      process.exit(1);
    }
    return;
  }

  if (options?.disable) {
    const result = await disableAutostart();
    if (result.success) {
      console.log(pc.yellow('✔ Hostmagic OS startup has been disabled.'));
    } else {
      console.error(pc.red(`✖ Failed to disable OS startup: ${result.error}`));
      process.exit(1);
    }
    return;
  }

  const status = await getAutostartStatus();
  console.log(`\n🪄 ${pc.bold('Hostmagic OS Startup Status')}:`);
  console.log(`  • Platform: ${pc.cyan(status.platform)}`);
  console.log(`  • Status:   ${status.enabled ? pc.green(pc.bold('ENABLED (Starts on Boot)')) : pc.dim('DISABLED')}`);
  console.log(`  • Command:  ${pc.dim(status.command || 'hostmagic start')}\n`);
}
