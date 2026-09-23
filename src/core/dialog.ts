import { spawn } from 'node:child_process';
import os from 'node:os';

/**
 * Open native OS folder picker dialog across Windows, macOS, and Linux.
 * Returns the selected absolute directory path or undefined if cancelled.
 */
export async function pickFolderDialog(title: string = 'Select Project Folder'): Promise<string | undefined> {
  const platform = os.platform();

  if (platform === 'win32') {
    return new Promise((resolve) => {
      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "${title.replace(/"/g, '`"')}"
$dialog.ShowNewFolderButton = $true
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
}
`.trim();

      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-EncodedCommand', encoded], {
        windowsHide: false,
      });

      let stdout = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.on('error', () => resolve(undefined));
      child.on('close', () => {
        const trimmed = stdout.trim();
        resolve(trimmed.length > 0 ? trimmed : undefined);
      });
    });
  }

  if (platform === 'darwin') {
    return new Promise((resolve) => {
      const script = `POSIX path of (choose folder with prompt "${title.replace(/"/g, '\\"')}")`;
      const child = spawn('osascript', ['-e', script]);

      let stdout = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.on('error', () => resolve(undefined));
      child.on('close', (code) => {
        if (code === 0 && stdout.trim().length > 0) {
          resolve(stdout.trim());
        } else {
          resolve(undefined);
        }
      });
    });
  }

  // Linux (zenity -> kdialog -> fallback)
  return new Promise((resolve) => {
    const zenity = spawn('zenity', [
      '--file-selection',
      '--directory',
      `--title=${title}`,
    ]);

    let stdout = '';
    zenity.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    zenity.on('error', () => {
      // Fallback to kdialog
      const kdialog = spawn('kdialog', ['--getexistingdirectory', '.', '--title', title]);
      let kStdout = '';
      kdialog.stdout.on('data', (chunk) => {
        kStdout += chunk.toString();
      });
      kdialog.on('error', () => resolve(undefined));
      kdialog.on('close', (kCode) => {
        if (kCode === 0 && kStdout.trim().length > 0) {
          resolve(kStdout.trim());
        } else {
          resolve(undefined);
        }
      });
    });

    zenity.on('close', (code) => {
      if (code === 0 && stdout.trim().length > 0) {
        resolve(stdout.trim());
      } else {
        resolve(undefined);
      }
    });
  });
}
