import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { ReverseProxyServer } from '../core/proxy.js';
import { ensureSystemHostsEntry, syncHostsBlock } from '../core/hosts.js';
import { flushDnsCache } from '../core/dns.js';
import type { HostmagicConfig } from '../types.js';

export async function refreshSettingsCommand(): Promise<void> {
  console.log(pc.cyan('\n🪄 Refreshing Hostmagic settings & dashboard...'));

  // 1. Ensure system hosts file entry and flush DNS cache
  try {
    await ensureSystemHostsEntry();
    await flushDnsCache();
    console.log(pc.green('  ✔ System hosts file & DNS cache refreshed.'));
  } catch (err: any) {
    console.log(pc.yellow(`  ⚠ Hosts file check: ${err.message || err}`));
  }

  // 2. Check if Gateway is running on port 80
  const isGatewayActive = await ReverseProxyServer.isGatewayRunning(80);

  // 3. If running inside a project directory with .hostmagic.json, re-register routes
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, '.hostmagic.json');
  if (existsSync(configPath)) {
    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      const config: HostmagicConfig = JSON.parse(raw);
      if (config.services && config.services.length > 0) {
        const proxyRoutes = config.services
          .filter((s) => !!s.port)
          .map((s) => ({
            domain: s.domain,
            targetPort: s.port!,
            serviceName: s.name,
            type: s.type,
          }));

        const frontendRuntime = config.services.find((s) => s.type === 'frontend');

        if (isGatewayActive) {
          await ReverseProxyServer.registerWithGateway(80, {
            name: config.name,
            routes: proxyRoutes,
            frontendPort: frontendRuntime?.port,
          });
          console.log(pc.green(`  ✔ Synchronized active routes for [${config.name}].`));
        }

        try {
          await syncHostsBlock(config.name, proxyRoutes.map((r) => r.domain));
        } catch {}
      }
    } catch {
      // Ignored
    }
  }

  // 4. Update the running gateway's settings dashboard template in-memory
  if (isGatewayActive) {
    const refreshed = await ReverseProxyServer.refreshSettingsOnGateway(80);
    if (refreshed) {
      console.log(pc.green('  ✔ Running gateway dashboard updated with latest template.'));
    } else {
      console.log(
        pc.yellow('  ⚠ Running gateway detected, but it may be an older process that requires a restart.')
      );
    }
    console.log(
      pc.bold(
        pc.green(
          `\n✨ Hostmagic settings refreshed! Open ${pc.underline(pc.cyan('http://hostmagic.settings'))} in your browser.\n`
        )
      )
    );
  } else {
    console.log(
      pc.dim('\nℹ Hostmagic gateway is not currently running. Run `hm dev` to start it.\n')
    );
  }
}
