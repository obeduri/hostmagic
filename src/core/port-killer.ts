import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import kill from 'tree-kill';
import * as p from '@clack/prompts';
import pc from 'picocolors';

export interface ProcessInfo {
  pid: number;
  name?: string;
}

/**
 * Finds the PID and image name of the process listening on the given TCP port.
 * Fully compatible with Windows (netstat), macOS (lsof), and Linux (lsof/fuser/ss).
 */
export async function findProcessOnPort(port: number): Promise<ProcessInfo | null> {
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execa('netstat', ['-ano', '-p', 'tcp']);
      const lines = stdout.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // Match TCP lines: TCP  <local_ip>:<port>  <foreign_ip>:<port>  LISTENING  <pid>
        const match = trimmed.match(/^TCP\s+(\S+?):(\d+)\s+\S+\s+LISTENING\s+(\d+)$/i);
        if (match) {
          const listeningPort = parseInt(match[2], 10);
          const pid = parseInt(match[3], 10);
          if (listeningPort === port && !isNaN(pid) && pid > 0) {
            const name = await getProcessName(pid);
            return { pid, name };
          }
        }
      }
    } catch {
      return null;
    }
  } else {
    // Unix / macOS
    const pid = await findPidOnUnix(port);
    if (pid) {
      const name = await getProcessName(pid);
      return { pid, name };
    }
  }

  return null;
}

/**
 * Finds the PID listening on a TCP port on Unix-like systems (macOS / Linux).
 */
async function findPidOnUnix(port: number): Promise<number | null> {
  // 1. Try lsof (macOS and standard Linux)
  try {
    const { stdout } = await execa('lsof', ['-i', `:${port}`, '-sTCP:LISTEN', '-t']);
    const pid = parseInt(stdout.trim().split('\n')[0], 10);
    if (!isNaN(pid) && pid > 0) return pid;
  } catch {}

  // 2. Try fuser (common on Linux distros)
  try {
    const { stdout } = await execa('fuser', [`${port}/tcp`]);
    const pid = parseInt(stdout.trim().split(/\s+/)[0], 10);
    if (!isNaN(pid) && pid > 0) return pid;
  } catch {}

  // 3. Try ss (modern Linux socket statistics)
  try {
    const { stdout } = await execa('ss', ['-lptn', `sport = :${port}`]);
    const match = stdout.match(/pid=(\d+)/);
    if (match) {
      const pid = parseInt(match[1], 10);
      if (!isNaN(pid) && pid > 0) return pid;
    }
  } catch {}

  return null;
}

/**
 * Retrieves process image name by PID across platforms.
 */
export async function getProcessName(pid: number): Promise<string | undefined> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execa('tasklist', [
        '/FI',
        `PID eq ${pid}`,
        '/FO',
        'CSV',
        '/NH',
      ]);
      const trimmed = stdout.trim();
      if (trimmed && !trimmed.startsWith('INFO:')) {
        const parts = trimmed.split(',');
        return parts[0]?.replace(/"/g, '') || undefined;
      }
    } else {
      const { stdout } = await execa('ps', ['-p', String(pid), '-o', 'comm=']);
      return stdout.trim() || undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * Forcibly kills a process and its entire process tree across platforms.
 * Uses taskkill /F /T on Windows, tree-kill SIGKILL on Unix/macOS,
 * and verifies socket/process release.
 */
export async function terminateProcess(pid: number): Promise<void> {
  if (process.platform === 'win32') {
    try {
      await execa('taskkill', ['/F', '/T', '/PID', String(pid)]);
    } catch {
      // Fallback
    }
  }

  // Cross-platform tree-kill fallback
  await new Promise<void>((resolve) => {
    kill(pid, 'SIGKILL', () => resolve());
  });

  try {
    process.kill(pid, 'SIGKILL');
  } catch {}

  // Verify process has stopped
  const start = Date.now();
  while (isProcessAlive(pid) && Date.now() - start < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Final fallback if still alive
  if (isProcessAlive(pid)) {
    if (process.platform === 'win32') {
      try {
        await execa('powershell', ['-NoProfile', '-Command', `Stop-Process -Id ${pid} -Force`]);
      } catch {}
    } else {
      try {
        await execa('kill', ['-9', String(pid)], { reject: false });
      } catch {}
    }
  }
}

/**
 * Cross-platform check whether a PID is currently running.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    return err.code === 'EPERM';
  }
}

/**
 * Checks if a port is in use and interactively prompts the user to kill the occupying process.
 */
export async function freePortIfOccupied(
  port: number,
  serviceLabel: string,
  autoConfirm = false
): Promise<boolean> {
  let attempts = 0;
  while (attempts < 3) {
    const proc = await findProcessOnPort(port);
    if (!proc) {
      return true; // Port is free
    }

    attempts++;
    const desc = proc.name
      ? `${pc.bold(proc.name)} (PID ${pc.cyan(proc.pid)})`
      : `PID ${pc.cyan(proc.pid)}`;

    p.log.warn(
      `${pc.yellow('⚠️  Port conflict:')} Port ${pc.bold(port)} [${serviceLabel}] is currently in use by ${desc}.`
    );

    let confirm = autoConfirm;
    if (!confirm) {
      const response = await p.confirm({
        message: `Do you want to terminate ${desc} to free port ${port}?`,
        initialValue: true,
      });

      if (p.isCancel(response) || !response) {
        return false;
      }
      confirm = true;
    }

    const spinner = p.spinner();
    spinner.start(`Terminating process PID ${proc.pid}...`);

    await terminateProcess(proc.pid);

    // Wait a moment for OS socket release
    await new Promise((resolve) => setTimeout(resolve, 600));

    const stillOccupied = await findProcessOnPort(port);
    if (stillOccupied) {
      spinner.stop(pc.red(`Failed to release port ${port} on attempt ${attempts}.`));
      if (attempts >= 3) return false;
    } else {
      spinner.stop(pc.green(`Port ${port} successfully freed.`));
      return true;
    }
  }

  return false;
}

/**
 * Checks for a Next.js development server lock in the service directory
 * and offers to terminate any orphaned Next.js process holding it.
 */
export async function checkAndCleanNextLock(
  serviceDir: string,
  autoConfirm = false
): Promise<void> {
  const lockPath = path.join(serviceDir, '.next', 'dev', 'lock');
  if (!existsSync(lockPath)) return;

  try {
    const raw = await fs.readFile(lockPath, 'utf-8');
    let pid: number | undefined;

    try {
      const lock = JSON.parse(raw);
      if (typeof lock?.pid === 'number') {
        pid = lock.pid;
      }
    } catch {
      const match = raw.match(/\b\d+\b/);
      if (match) {
        pid = parseInt(match[0], 10);
      }
    }

    if (pid && !isNaN(pid) && pid > 0) {
      if (isProcessAlive(pid)) {
        const procName = await getProcessName(pid);
        const desc = procName
          ? `${pc.bold(procName)} (PID ${pc.cyan(pid)})`
          : `PID ${pc.cyan(pid)}`;

        p.log.warn(
          `${pc.yellow('⚠️  Next.js lock conflict:')} An active dev server (${desc}) is still registered in ${pc.bold(path.basename(serviceDir))}.`
        );

        let confirm = autoConfirm;
        if (!confirm) {
          const response = await p.confirm({
            message: `Do you want to terminate ${desc} to start a fresh server?`,
            initialValue: true,
          });
          if (p.isCancel(response) || !response) {
            return;
          }
          confirm = true;
        }

        const spinner = p.spinner();
        spinner.start(`Terminating Next.js process (PID ${pid})...`);
        await terminateProcess(pid);
        try {
          await fs.unlink(lockPath);
        } catch {}
        spinner.stop(pc.green(`Terminated process and cleared .next lock.`));
      } else {
        // Stale lockfile from an already terminated process, clean it up
        try {
          await fs.unlink(lockPath);
        } catch {}
      }
    } else {
      // Malformed lockfile, clean it up
      try {
        await fs.unlink(lockPath);
      } catch {}
    }
  } catch {
    // Ignore filesystem errors
  }
}

/**
 * Detects if a service already has a fixed port configured (e.g. from existing .hostmagic.json).
 * Returns undefined if no specific port is configured so allocateUniquePorts assigns
 * a unique random port in the 40000-65535 range, preventing projects from colliding.
 */
export async function detectPreferredPort(
  _serviceDir: string,
  _type: string,
  _framework?: string,
  existingPort?: number
): Promise<number | undefined> {
  if (existingPort && existingPort > 0) {
    return existingPort;
  }
  return undefined;
}
