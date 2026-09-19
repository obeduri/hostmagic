import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execa } from 'execa';
import { flushDnsCache } from './dns.js';

export function getHostsPath(): string {
  if (process.platform === 'win32') {
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    return path.join(systemRoot, 'System32', 'drivers', 'etc', 'hosts');
  }
  return '/etc/hosts';
}

/**
 * Checks if the current process has write permissions to the hosts file or admin rights.
 */
export async function isElevated(): Promise<boolean> {
  const hostsPath = getHostsPath();
  try {
    // Try opening file in append mode
    const handle = await fs.open(hostsPath, 'r+');
    await handle.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats hosts entries inside a delimited block for a specific project.
 */
export function formatBlock(projectName: string, domains: string[], customEol?: string): string {
  const eol = customEol || (process.platform === 'win32' ? '\r\n' : '\n');
  const uniqueDomains = Array.from(new Set(domains)).filter(Boolean);
  const lines = [
    `# BEGIN hostmagic:${projectName}`,
    ...uniqueDomains.map((domain) => `127.0.0.1  ${domain}`),
    `# END hostmagic:${projectName}`,
  ];
  return lines.join(eol);
}

/**
 * Replaces or appends the project's block in the hosts content.
 */
export function updateHostsContent(
  currentContent: string,
  projectName: string,
  domains: string[]
): string {
  const eol = currentContent.includes('\r\n') ? '\r\n' : '\n';
  const newBlock = formatBlock(projectName, domains, eol);

  // Clean up any orphaned legacy artifacts like ":projectName" on their own line
  const cleanedContent = currentContent.replace(/^[ \t]*:[a-zA-Z0-9_-]+[ \t]*(?:\r?\n|$)/gm, '');

  // Regex matches exact named project block
  const namedRegex = new RegExp(
    `# BEGIN hostmagic:${escapeRegex(projectName)}[\\s\\S]*?# END hostmagic:${escapeRegex(projectName)}(?:\\r?\\n)?`,
    'g'
  );
  // Matches legacy non-named hostmagic block strictly without :projectName
  const legacyRegex = /# BEGIN hostmagic[ \t]*(?:\r?\n)[\s\S]*?# END hostmagic[ \t]*(?:\r?\n)?/g;

  let updated = cleanedContent;

  if (namedRegex.test(updated)) {
    updated = updated.replace(namedRegex, newBlock + eol);
  } else if (legacyRegex.test(updated)) {
    // Replace legacy block if existing
    updated = updated.replace(legacyRegex, newBlock + eol);
  } else {
    // Append at the end
    const trimmed = updated.trimEnd();
    updated = trimmed + eol + eol + newBlock + eol;
  }

  return updated;
}

/**
 * Removes the project's block (or all hostmagic blocks if projectName is '*') from hosts content.
 */
export function removeHostsContent(currentContent: string, projectName?: string): string {
  const eol = currentContent.includes('\r\n') ? '\r\n' : '\n';

  let regex: RegExp;
  if (!projectName || projectName === '*') {
    regex = /# BEGIN hostmagic(?::[^\r\n]*)?[\s\S]*?# END hostmagic(?::[^\r\n]*)?(\r?\n)?/g;
  } else {
    regex = new RegExp(
      `# BEGIN hostmagic:${escapeRegex(projectName)}[\\s\\S]*?# END hostmagic:${escapeRegex(projectName)}(\\r?\\n)?`,
      'g'
    );
  }

  let updated = currentContent.replace(regex, '');
  if (projectName && projectName !== '*') {
    const orphanRegex = new RegExp(`^[ \\t]*:${escapeRegex(projectName)}[ \\t]*(?:\\r?\\n|$)`, 'gm');
    updated = updated.replace(orphanRegex, '');
  } else {
    updated = updated.replace(/^[ \\t]*:[a-zA-Z0-9_-]+[ \\t]*(?:\\r?\\n|$)/gm, '');
  }
  return updated.trimEnd() + eol;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Writes the new content to hosts file, triggering UAC on Windows or sudo on Unix if needed.
 */
export async function writeHosts(newContent: string): Promise<void> {
  const hostsPath = getHostsPath();

  // Create temporary backup in os.tmpdir()
  try {
    const backupPath = path.join(os.tmpdir(), `hosts.hostmagic.bak`);
    if (existsSync(hostsPath)) {
      await fs.copyFile(hostsPath, backupPath);
    }
  } catch {
    // Non-critical backup failure
  }

  // If already elevated, write directly
  const elevated = await isElevated();
  if (elevated) {
    await fs.writeFile(hostsPath, newContent, 'utf-8');
    await flushDnsCache();
    return;
  }

  // Elevated write is required
  const timestamp = Date.now();
  const tempFilePath = path.join(os.tmpdir(), `hostmagic_hosts_${timestamp}.tmp`);
  const tempScriptPath = path.join(os.tmpdir(), `hostmagic_update_${timestamp}.ps1`);
  await fs.writeFile(tempFilePath, newContent, 'utf-8');

  try {
    if (process.platform === 'win32') {
      const scriptContent = [
        `param()`,
        `$ErrorActionPreference = 'Stop'`,
        `try {`,
        `    $src = '${tempFilePath.replace(/'/g, "''")}'`,
        `    $dst = '${hostsPath.replace(/'/g, "''")}'`,
        `    if (Test-Path $dst) {`,
        `        Set-ItemProperty -Path $dst -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue`,
        `    }`,
        `    Copy-Item -LiteralPath $src -Destination $dst -Force`,
        `    exit 0`,
        `} catch {`,
        `    exit 1`,
        `}`,
      ].join('\r\n');

      await fs.writeFile(tempScriptPath, scriptContent, 'utf-8');

      const psCommand = `try { $proc = Start-Process powershell.exe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '${tempScriptPath.replace(/'/g, "''")}') -Verb RunAs -Wait -PassThru; exit $proc.ExitCode } catch { exit 1223 }`;

      const result = await execa(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
        { reject: false }
      );

      if (result.exitCode === 1223) {
        throw new Error('Windows UAC elevation was declined by the user.');
      }

      if (result.exitCode !== 0) {
        throw new Error(
          `Windows UAC elevation failed with exit code ${result.exitCode}.${result.stderr ? ` Details: ${result.stderr}` : ''}`
        );
      }
    } else {
      // Unix: use sudo to copy and ensure readable permissions
      await execa('sudo', ['cp', tempFilePath, hostsPath], { stdio: 'inherit' });
      await execa('sudo', ['chmod', '644', hostsPath], { reject: false });
    }

    // Flush DNS cache after write
    await flushDnsCache();
  } finally {
    // Clean up temporary files
    await fs.unlink(tempFilePath).catch(() => {});
    if (process.platform === 'win32') {
      await fs.unlink(tempScriptPath).catch(() => {});
    }
  }
}

/**
 * Reads hosts file content, updates block for projectName with given domains, and writes it back.
 */
export async function syncHostsBlock(projectName: string, domains: string[]): Promise<void> {
  const hostsPath = getHostsPath();
  const currentContent = existsSync(hostsPath)
    ? await fs.readFile(hostsPath, 'utf-8')
    : '';

  const newContent = updateHostsContent(currentContent, projectName, domains);
  await writeHosts(newContent);
}

/**
 * Reads hosts file content, removes block for projectName, and writes it back.
 */
export async function clearHostsBlock(projectName?: string): Promise<void> {
  const hostsPath = getHostsPath();
  if (!existsSync(hostsPath)) {
    return;
  }

  const currentContent = await fs.readFile(hostsPath, 'utf-8');
  const newContent = removeHostsContent(currentContent, projectName);
  await writeHosts(newContent);
}

export interface OpenHostsFileOptions {
  editor?: string;
  customPath?: string;
}

export interface OpenHostsFileResult {
  path: string;
  editor: string;
}

/**
 * Opens the system hosts file in the user's preferred or default editor across all OSes (Windows, macOS, Linux).
 */
export async function openHostsFile(options?: OpenHostsFileOptions): Promise<OpenHostsFileResult> {
  const hostsPath = options?.customPath || getHostsPath();

  if (!existsSync(hostsPath)) {
    throw new Error(`Hosts file does not exist at path: ${hostsPath}`);
  }

  const preferredEditor = options?.editor || process.env.VISUAL || process.env.EDITOR;

  if (preferredEditor) {
    const isTerminalEditor = /^(nano|vim|vi|emacs|nvim|micro|pico|hx|helix)(\.exe)?$/i.test(
      path.basename(preferredEditor)
    );

    if (isTerminalEditor) {
      await execa(preferredEditor, [hostsPath], { stdio: 'inherit' });
    } else {
      const child = execa(preferredEditor, [hostsPath], {
        detached: true,
        stdio: 'ignore',
        cleanup: false,
      });
      child.unref();
    }
    return { path: hostsPath, editor: preferredEditor };
  }

  // OS-specific default openers
  if (process.platform === 'win32') {
    const notepadPath = process.env.SystemRoot
      ? path.join(process.env.SystemRoot, 'System32', 'notepad.exe')
      : 'notepad.exe';
    const child = execa(notepadPath, [hostsPath], {
      detached: true,
      stdio: 'ignore',
      cleanup: false,
    });
    child.unref();
    return { path: hostsPath, editor: 'Notepad' };
  }

  if (process.platform === 'darwin') {
    const child = execa('open', ['-t', hostsPath], {
      detached: true,
      stdio: 'ignore',
      cleanup: false,
    });
    child.unref();
    return { path: hostsPath, editor: 'Default Text Editor' };
  }

  // Linux and other Unix
  const hasDisplay = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
  if (hasDisplay) {
    try {
      const child = execa('xdg-open', [hostsPath], {
        detached: true,
        stdio: 'ignore',
        cleanup: false,
      });
      child.unref();
      return { path: hostsPath, editor: 'xdg-open' };
    } catch {
      // Fallback to terminal editors if xdg-open fails
    }
  }

  // Terminal editor fallback for Linux / Unix without GUI
  for (const editor of ['nano', 'vim', 'vi']) {
    try {
      await execa(editor, [hostsPath], { stdio: 'inherit' });
      return { path: hostsPath, editor };
    } catch {
      continue;
    }
  }

  throw new Error(`Unable to determine default text editor to open ${hostsPath}. Please set $EDITOR or specify with --editor.`);
}

