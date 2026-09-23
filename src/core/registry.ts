import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getHostsPath } from './hosts.js';
import type { HostmagicConfig, RegisteredProject, ServiceConfig } from '../types.js';

export interface GlobalRegistry {
  projects: RegisteredProject[];
}

export function getRegistryDir(): string {
  return path.join(os.homedir(), '.hostmagic');
}

export function getRegistryFilePath(): string {
  return path.join(getRegistryDir(), 'projects.json');
}

export async function loadRegistry(): Promise<GlobalRegistry> {
  const filePath = getRegistryFilePath();
  if (!existsSync(filePath)) {
    return { projects: [] };
  }
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.projects)) {
      return parsed;
    }
    return { projects: [] };
  } catch {
    return { projects: [] };
  }
}

export async function saveRegistry(registry: GlobalRegistry): Promise<void> {
  const dir = getRegistryDir();
  try {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    const filePath = getRegistryFilePath();
    await fs.writeFile(filePath, JSON.stringify(registry, null, 2), 'utf-8');
  } catch {
    // Non-fatal if directory cannot be created
  }
}

export async function registerProjectInGlobalRegistry(
  config: HostmagicConfig,
  projectPath: string
): Promise<RegisteredProject> {
  const registry = await loadRegistry();
  const normalizedPath = path.resolve(projectPath);
  const now = Date.now();

  const existingIndex = registry.projects.findIndex(
    (p) =>
      p.name.toLowerCase() === config.name.toLowerCase() ||
      path.resolve(p.path).toLowerCase() === normalizedPath.toLowerCase()
  );

  const entry: RegisteredProject = {
    name: config.name,
    path: normalizedPath,
    tld: config.tld || 'test',
    services: config.services || [],
    lastRun: now,
    createdAt: existingIndex >= 0 ? registry.projects[existingIndex].createdAt || now : now,
  };

  if (existingIndex >= 0) {
    registry.projects[existingIndex] = entry;
  } else {
    registry.projects.push(entry);
  }

  await saveRegistry(registry);
  return entry;
}

export async function unregisterProjectFromGlobalRegistry(projectName: string): Promise<boolean> {
  const registry = await loadRegistry();
  const initialLength = registry.projects.length;
  registry.projects = registry.projects.filter(
    (p) => p.name.toLowerCase() !== projectName.toLowerCase()
  );
  if (registry.projects.length !== initialLength) {
    await saveRegistry(registry);
    return true;
  }
  return false;
}

export async function getKnownProjects(): Promise<RegisteredProject[]> {
  const registry = await loadRegistry();
  const knownMap = new Map<string, RegisteredProject>();

  // 1. Load from saved registry (source of truth)
  for (const p of registry.projects) {
    if (p && p.name) {
      knownMap.set(p.name.toLowerCase(), { ...p });
    }
  }

  // 2. Discover from system hosts file blocks (# BEGIN hostmagic:<project>) as fallback
  try {
    const hostsPath = getHostsPath();
    if (existsSync(hostsPath)) {
      const content = await fs.readFile(hostsPath, 'utf-8');
      const blockRegex = /# BEGIN hostmagic:([a-zA-Z0-9_-]+)\r?\n([\s\S]*?)# END hostmagic:\1/g;
      let match: RegExpExecArray | null;
      while ((match = blockRegex.exec(content)) !== null) {
        const pName = match[1].trim();
        if (pName && pName !== 'system') {
          const blockBody = match[2];
          const domainLines = blockBody
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith('127.0.0.1'))
            .map((line) => line.replace(/^127\.0\.0\.1\s+/, '').trim())
            .filter(Boolean);

          const key = pName.toLowerCase();
          if (!knownMap.has(key) && domainLines.length > 0) {
            // Check if current directory's .hostmagic.json matches this project name
            let matchedPath = '';
            const cwdConfigPath = path.join(process.cwd(), '.hostmagic.json');
            if (existsSync(cwdConfigPath)) {
              try {
                const curConfig: HostmagicConfig = JSON.parse(await fs.readFile(cwdConfigPath, 'utf-8'));
                if (curConfig.name && curConfig.name.toLowerCase() === key) {
                  matchedPath = process.cwd();
                }
              } catch {}
            }

            const services: ServiceConfig[] = domainLines.map((domain, i) => ({
              name: domain.split('.')[0] || `service-${i + 1}`,
              path: '.',
              type: i === 0 ? 'frontend' : 'custom',
              domain,
              command: 'npm run dev',
            }));

            knownMap.set(key, {
              name: pName,
              path: matchedPath,
              tld: domainLines[0]?.split('.').pop() || 'test',
              services,
              createdAt: Date.now(),
            });
          }
        }
      }
    }
  } catch {}

  // 3. For each known project with a valid matching path, refresh from .hostmagic.json if available
  const finalMap = new Map<string, RegisteredProject>();

  for (const p of knownMap.values()) {
    if (p.path && existsSync(p.path)) {
      const configPath = path.join(p.path, '.hostmagic.json');
      if (existsSync(configPath)) {
        try {
          const raw = await fs.readFile(configPath, 'utf-8');
          const conf: HostmagicConfig = JSON.parse(raw);
          // Only update if the config file belongs to this project name
          if (conf.name && conf.name.toLowerCase() === p.name.toLowerCase()) {
            p.name = conf.name;
            p.tld = conf.tld || p.tld;
            p.services = conf.services || p.services;
          }
        } catch {}
      }
    }

    const uniqueKey = p.name.toLowerCase();
    if (!finalMap.has(uniqueKey)) {
      finalMap.set(uniqueKey, p);
    }
  }

  const result = Array.from(finalMap.values());
  // Sort by lastRun or createdAt desc
  result.sort((a, b) => (b.lastRun || b.createdAt || 0) - (a.lastRun || a.createdAt || 0));
  return result;
}
