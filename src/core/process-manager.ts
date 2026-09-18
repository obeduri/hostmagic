import path from 'node:path';
import readline from 'node:readline';
import { execa, type ResultPromise } from 'execa';
import pc from 'picocolors';
import { terminateProcess } from './port-killer.js';
import type { ServiceRuntimeInfo } from '../types.js';

interface RunningProcess {
  name: string;
  subprocess: ResultPromise;
  pid?: number;
}

export class ProcessManager {
  private processes: RunningProcess[] = [];
  private isShuttingDown = false;
  private stopHooks: Array<() => Promise<void> | void> = [];

  constructor() {
    this.setupSignalHandlers();
  }

  public onStop(hook: () => Promise<void> | void): void {
    this.stopHooks.push(hook);
  }

  private setupSignalHandlers(): void {
    const handleSignal = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      if (process.stdin.isTTY) {
        try {
          process.stdin.setRawMode(false);
          process.stdin.pause();
        } catch {
          // Ignored
        }
      }

      console.log(`\n${pc.yellow(`Received ${signal}, stopping all services cleanly...`)}`);
      await this.stopAll();
      process.exit(0);
    };

    process.on('SIGINT', () => handleSignal('SIGINT'));
    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    process.on('SIGHUP', () => handleSignal('SIGHUP'));

    // Listen for ESC key in interactive terminals
    if (process.stdin.isTTY) {
      readline.emitKeypressEvents(process.stdin);
      try {
        process.stdin.setRawMode(true);
        process.stdin.resume();

        process.stdin.on('keypress', (_str, key) => {
          if (key.name === 'escape') {
            handleSignal('ESC');
          } else if (key.ctrl && key.name === 'c') {
            handleSignal('SIGINT');
          }
        });
      } catch {
        // Ignored if raw mode is not supported in current environment
      }
    }
  }

  private getPrefix(serviceType: string, name: string): string {
    if (serviceType === 'frontend') {
      return pc.cyan(pc.bold('[FRONT]'));
    }
    if (serviceType === 'backend') {
      return pc.magenta(pc.bold('[BACK] '));
    }
    return pc.yellow(pc.bold(`[${name.toUpperCase().slice(0, 5)}]`));
  }

  private attachPrefixedLogger(stream: NodeJS.ReadableStream, prefix: string): void {
    let buffer = '';

    stream.on('data', (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.trim().length > 0 || line.length > 0) {
          process.stdout.write(`${prefix} ${line}\n`);
        }
      }
    });

    stream.on('end', () => {
      if (buffer.length > 0) {
        process.stdout.write(`${prefix} ${buffer}\n`);
        buffer = '';
      }
    });
  }

  public async startService(
    rootDir: string,
    info: ServiceRuntimeInfo
  ): Promise<void> {
    const prefix = this.getPrefix(info.service.type, info.service.name);

    // Merge process environment with custom injected variables
    const mergedEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...info.env,
    };

    const parts = info.service.command.split(' ');
    const file = parts[0];
    const args = parts.slice(1);

    const fullCwd = path.resolve(rootDir, info.service.path);

    const subprocess = execa(file, args, {
      cwd: fullCwd,
      env: mergedEnv,
      shell: true,
      preferLocal: true,
      all: false,
    });

    const running: RunningProcess = {
      name: info.service.name,
      subprocess,
      pid: subprocess.pid,
    };

    this.processes.push(running);

    if (subprocess.stdout) {
      this.attachPrefixedLogger(subprocess.stdout, prefix);
    }
    if (subprocess.stderr) {
      this.attachPrefixedLogger(subprocess.stderr, prefix);
    }

    subprocess.catch((err) => {
      if (!this.isShuttingDown && !err.isCanceled) {
        console.error(
          `${prefix} ${pc.red(`Process exited unexpectedly: ${err.message}`)}`
        );
      }
    });
  }

  public async stopAll(): Promise<void> {
    const killPromises = this.processes.map(async (proc) => {
      if (proc.pid) {
        try {
          // Send SIGKILL/taskkill to the entire process tree
          await terminateProcess(proc.pid);
        } catch {
          // If already stopped, ignore error
        }
      }
      try {
        proc.subprocess.kill();
      } catch {
        // Ignored
      }
    });

    await Promise.allSettled(killPromises);
    this.processes = [];

    const hookPromises = this.stopHooks.map((h) => Promise.resolve(h()));
    await Promise.allSettled(hookPromises);
    this.stopHooks = [];
  }

  public async waitForAll(): Promise<void> {
    await Promise.all(this.processes.map((p) => p.subprocess));
  }
}
