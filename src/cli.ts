import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { cleanCommand } from './commands/clean.js';

const program = new Command();

program
  .name('hostmagic')
  .description('Automate local fullstack dev with .local domains, random ephemeral ports, and concurrent execution')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Hostmagic in the current directory and configure local hosts')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .option('-n, --name <name>', 'Custom project name for domains')
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

program.parse(process.argv);
