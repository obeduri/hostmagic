import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

export interface AutostartStatus {
  enabled: boolean;
  platform: string;
  command?: string;
  error?: string;
}

/**
 * Resolves the path to the Hostmagic CLI entry file.
 */
export function getCliEntryPath(): string {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const distDir = path.dirname(currentFile); // src/core or dist
    // If in dist/
    const candidateDist = path.join(distDir, 'cli.js');
    if (existsSync(candidateDist)) return candidateDist;
    // If in src/core/
    const candidateParentDist = path.resolve(distDir, '../../dist/cli.js');
    if (existsSync(candidateParentDist)) return candidateParentDist;
  } catch {}
  return process.argv[1] || 'hostmagic';
}

/**
 * Checks if Hostmagic is configured to start on Operating System startup.
 */
export async function isAutostartEnabled(): Promise<boolean> {
  const platform = process.platform;
  const home = os.homedir();

  try {
    if (platform === 'win32') {
      const { stdout } = await execa('reg', [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        '/v',
        'Hostmagic'
      ]);
      return stdout.includes('Hostmagic');
    } else if (platform === 'darwin') {
      const plistPath = path.join(home, 'Library', 'LaunchAgents', 'com.hostmagic.gateway.plist');
      return existsSync(plistPath);
    } else if (platform === 'linux') {
      const desktopPath = path.join(home, '.config', 'autostart', 'hostmagic.desktop');
      const servicePath = path.join(home, '.config', 'systemd', 'user', 'hostmagic.service');
      return existsSync(desktopPath) || existsSync(servicePath);
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Enables starting Hostmagic Gateway on Operating System startup.
 */
export async function enableAutostart(): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform;
  const home = os.homedir();
  const hostmagicDir = path.join(home, '.hostmagic');

  try {
    if (!existsSync(hostmagicDir)) {
      await fs.mkdir(hostmagicDir, { recursive: true });
    }

    const execPath = process.execPath;
    const cliPath = getCliEntryPath();

    if (platform === 'win32') {
      // Create a background launcher script via VBS to run silently without popping up a console window
      const vbsPath = path.join(hostmagicDir, 'autostart.vbs');
      const vbsContent = [
        'Set WshShell = CreateObject("WScript.Shell")',
        `WshShell.Run Chr(34) & "${execPath.replace(/\\/g, '\\\\')}" & Chr(34) & " " & Chr(34) & "${cliPath.replace(/\\/g, '\\\\')}" & Chr(34) & " start", 0, False`,
        ''
      ].join('\r\n');

      await fs.writeFile(vbsPath, vbsContent, 'utf-8');

      // Register with HKCU Run
      await execa('reg', [
        'add',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        '/v',
        'Hostmagic',
        '/t',
        'REG_SZ',
        '/d',
        `wscript.exe "${vbsPath}"`,
        '/f'
      ]);

      return { success: true };
    } else if (platform === 'darwin') {
      const agentsDir = path.join(home, 'Library', 'LaunchAgents');
      if (!existsSync(agentsDir)) {
        await fs.mkdir(agentsDir, { recursive: true });
      }

      const plistPath = path.join(agentsDir, 'com.hostmagic.gateway.plist');
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hostmagic.gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>${execPath}</string>
        <string>${cliPath}</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${path.join(hostmagicDir, 'autostart.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(hostmagicDir, 'autostart.err')}</string>
</dict>
</plist>
`;

      await fs.writeFile(plistPath, plistContent, 'utf-8');

      try {
        await execa('launchctl', ['load', plistPath]);
      } catch {}

      return { success: true };
    } else if (platform === 'linux') {
      const autostartDir = path.join(home, '.config', 'autostart');
      if (!existsSync(autostartDir)) {
        await fs.mkdir(autostartDir, { recursive: true });
      }

      const desktopPath = path.join(autostartDir, 'hostmagic.desktop');
      const desktopContent = `[Desktop Entry]
Type=Application
Exec="${execPath}" "${cliPath}" start
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Hostmagic Gateway
Comment=Start Hostmagic Gateway on OS login
Terminal=false
`;

      await fs.writeFile(desktopPath, desktopContent, 'utf-8');
      return { success: true };
    }

    return { success: false, error: `Unsupported platform: ${platform}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to enable autostart' };
  }
}

/**
 * Disables starting Hostmagic Gateway on Operating System startup.
 */
export async function disableAutostart(): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform;
  const home = os.homedir();
  const hostmagicDir = path.join(home, '.hostmagic');

  try {
    if (platform === 'win32') {
      try {
        await execa('reg', [
          'delete',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
          '/v',
          'Hostmagic',
          '/f'
        ]);
      } catch {}

      const vbsPath = path.join(hostmagicDir, 'autostart.vbs');
      if (existsSync(vbsPath)) {
        try {
          await fs.unlink(vbsPath);
        } catch {}
      }

      return { success: true };
    } else if (platform === 'darwin') {
      const plistPath = path.join(home, 'Library', 'LaunchAgents', 'com.hostmagic.gateway.plist');
      if (existsSync(plistPath)) {
        try {
          await execa('launchctl', ['unload', plistPath]);
        } catch {}
        try {
          await fs.unlink(plistPath);
        } catch {}
      }
      return { success: true };
    } else if (platform === 'linux') {
      const desktopPath = path.join(home, '.config', 'autostart', 'hostmagic.desktop');
      if (existsSync(desktopPath)) {
        try {
          await fs.unlink(desktopPath);
        } catch {}
      }
      return { success: true };
    }

    return { success: false, error: `Unsupported platform: ${platform}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to disable autostart' };
  }
}

/**
 * Gets the current autostart status and details.
 */
export async function getAutostartStatus(): Promise<AutostartStatus> {
  const enabled = await isAutostartEnabled();
  return {
    enabled,
    platform: process.platform,
    command: `${process.execPath} ${getCliEntryPath()} start`
  };
}
