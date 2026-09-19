import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { cleanCommand } from './commands/clean.js';
import { hostfileCommand } from './commands/hostfile.js';
import { refreshSettingsCommand } from './commands/refresh-settings.js';

const program = new Command();

program
  .name('hostmagic')
  .description('Automate local fullstack dev with .test domains, ephemeral ports, and universal OAuth 2.0 on macOS, Linux, and Windows (alias: hm)')
  .version('1.0.6')
  .option('-rs, --refresh-settings', 'Refresh hostmagic.settings dashboard and routes on the running gateway')
  .option('--rs', 'Alias for --refresh-settings')
  .option('-H, --hostfile', 'Open the system hosts file in your default editor across macOS, Linux, and Windows')
  .option('--hostsfile', 'Alias for --hostfile')
  .option('--hosts', 'Alias for --hostfile')
  .option('-e, --editor <editor>', 'Custom editor to open the hosts file with')
  .action(async (options) => {
    if (options.refreshSettings || options.rs) {
      try {
        await refreshSettingsCommand();
      } catch (err: any) {
        console.error(err.message || err);
        process.exit(1);
      }
      return;
    }
    if (options.hostfile || options.hostsfile || options.hosts) {
      try {
        await hostfileCommand({ editor: options.editor });
      } catch (err: any) {
        console.error(err.message || err);
        process.exit(1);
      }
      return;
    }
    program.help();
  });

program
  .command('init')
  .description('Initialize Hostmagic in the current directory and configure local hosts')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .option('-n, --name <name>', 'Custom project name for domains')
  .option('-t, --tld <tld>', 'Custom top-level domain or suffix (default: "test", e.g. "localtest.me")')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (err: any) {
      console.error(err.message || err);
      process.exit(1);
    }
  });

program
  .command('run')
  .alias('dev')
  .alias('start')
  .description('Allocate dynamic ephemeral ports and run all configured services concurrently')
  .action(async () => {
    try {
      await runCommand();
    } catch (err: any) {
      console.error(err.message || err);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remove Hostmagic domain entries from the system hosts file')
  .option('-a, --all', 'Remove all Hostmagic blocks across all projects')
  .option('-y, --yes', 'Skip confirmation warning prompt')
  .action(async (options) => {
    try {
      await cleanCommand(options);
    } catch (err: any) {
      console.error(err.message || err);
      process.exit(1);
    }
  });

program
  .command('hostfile')
  .alias('hosts')
  .alias('hostsfile')
  .description('Open the system hosts file in your default editor')
  .option('-e, --editor <editor>', 'Custom editor to open the hosts file with')
  .action(async (options) => {
    try {
      await hostfileCommand(options);
    } catch (err: any) {
      console.error(err.message || err);
      process.exit(1);
    }
  });

program
  .command('refresh-settings')
  .alias('rs')
  .description('Refresh hostmagic.settings dashboard and routes on the running gateway')
  .action(async () => {
    try {
      await refreshSettingsCommand();
    } catch (err: any) {
      console.error(err.message || err);
      process.exit(1);
    }
  });

program.parse(process.argv);

