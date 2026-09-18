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
export function formatBlock(projectName: string, domains: string[]): string {
  const eol = process.platform === 'win32' ? '\r\n' : '\n';
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
  const newBlock = formatBlock(projectName, domains);

  // Regex matches both named project block and legacy non-named block
  const namedRegex = new RegExp(
    `# BEGIN hostmagic:${escapeRegex(projectName)}[\\s\\S]*?# END hostmagic:${escapeRegex(projectName)}(\\r?\\n)?`,
    'g'
  );
  const legacyRegex = /# BEGIN hostmagic[\s\S]*?# END hostmagic(\r?\n)?/g;

  let updated = currentContent;

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

  const updated = currentContent.replace(regex, '');
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
  const tempFilePath = path.join(os.tmpdir(), `hostmagic_hosts_${Date.now()}.tmp`);
  await fs.writeFile(tempFilePath, newContent, 'utf-8');

  try {
    if (process.platform === 'win32') {
      // Execute elevated PowerShell copy via UAC prompt
      const command = `Copy-Item -LiteralPath '${tempFilePath.replace(/'/g, "''")}' -Destination '${hostsPath.replace(/'/g, "''")}' -Force`;
      const args = [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        `Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command \\"${command}\\"" -Verb RunAs -Wait`,
      ];

      const result = await execa('powershell.exe', args, { reject: false });
      if (result.exitCode !== 0) {
        throw new Error(
          `Windows UAC elevation was cancelled or failed with code ${result.exitCode}.`
        );
      }
    } else {
      // Unix: use sudo
      await execa('sudo', ['cp', tempFilePath, hostsPath], { stdio: 'inherit' });
    }

    // Flush DNS cache after write
    await flushDnsCache();
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignored
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
