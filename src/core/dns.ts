import { execa } from 'execa';

/**
 * Flushes the operating system DNS resolver cache to ensure immediate hostname resolution.
 */
export async function flushDnsCache(): Promise<boolean> {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      await execa('ipconfig', ['/flushdns']);
      return true;
    } else if (platform === 'darwin') {
      await execa('dscacheutil', ['-flushcache']);
      try {
        await execa('killall', ['-HUP', 'mDNSResponder']);
      } catch {
        // Ignored if mDNSResponder cannot be signaled without sudo
      }
      return true;
    } else if (platform === 'linux') {
      // Try modern systemd-resolved commands
      try {
        await execa('resolvectl', ['flush-caches']);
        return true;
      } catch {
        try {
          await execa('systemd-resolve', ['--flush-caches']);
          return true;
        } catch {
          // No systemd-resolved found; silent fallback
          return false;
        }
      }
    }
  } catch {
    // DNS flush failure is non-fatal
    return false;
  }

  return false;
}
