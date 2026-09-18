import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { DetectedService, ServiceType } from '../types.js';

const CANDIDATE_DIRS = [
  'frontend',
  'backend',
  'client',
  'server',
  'apps/web',
  'apps/api',
  'apps/client',
  'apps/server',
  'packages/web',
  'packages/api',
];

const FRONTEND_DEPS = [
  'next',
  'vite',
  'astro',
  'nuxt',
  'remix',
  '@angular/core',
  'vue',
  'svelte',
  '@sveltejs/kit',
];

const BACKEND_DEPS = [
  '@nestjs/core',
  'express',
  'fastify',
  'koa',
  'hono',
  '@adonisjs/core',
  'typeorm',
  'prisma',
  '@prisma/client',
];

/**
 * Determines package manager based on lockfiles in directory or parent root.
 */
export async function detectPackageManager(dir: string, rootDir: string): Promise<string> {
  const dirsToCheck = [dir, rootDir];

  for (const d of dirsToCheck) {
    if (existsSync(path.join(d, 'bun.lockb')) || existsSync(path.join(d, 'bun.lock'))) {
      return 'bun';
    }
    if (existsSync(path.join(d, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync(path.join(d, 'yarn.lock'))) {
      return 'yarn';
    }
    if (existsSync(path.join(d, 'package-lock.json'))) {
      return 'npm';
    }
  }

  // Fallback check: if running with bun
  if (typeof (process.versions as Record<string, string>)?.bun !== 'undefined') {
    return 'bun';
  }

  return 'npm';
}

/**
 * Inspects a folder's package.json to classify service type, framework and command.
 */
export async function analyzeDirectory(
  fullPath: string,
  relativePath: string,
  projectName: string,
  rootDir: string,
  tld: string = 'local'
): Promise<DetectedService | null> {
  const pkgPath = path.join(fullPath, 'package.json');
  if (!existsSync(pkgPath)) {
    return null;
  }

  let pkg: any;
  try {
    const raw = await fs.readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(raw);
  } catch {
    return null;
  }

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const detectedFrontend = FRONTEND_DEPS.find((dep) => dep in allDeps);
  const detectedBackend = BACKEND_DEPS.find((dep) => dep in allDeps);

  let type: ServiceType = 'custom';
  let framework: string | undefined;

  // Heuristic based on dependencies first, then folder naming
  const lowerRel = relativePath.toLowerCase();
  if (detectedFrontend) {
    type = 'frontend';
    framework = detectedFrontend;
  } else if (detectedBackend) {
    type = 'backend';
    framework = detectedBackend;
  } else if (lowerRel.includes('front') || lowerRel.includes('client') || lowerRel.includes('web')) {
    type = 'frontend';
  } else if (lowerRel.includes('back') || lowerRel.includes('server') || lowerRel.includes('api')) {
    type = 'backend';
  }

  // Package manager and start command
  const pm = await detectPackageManager(fullPath, rootDir);
  const scripts = pkg.scripts || {};

  let scriptName = 'dev';
  if (!scripts.dev) {
    if (scripts.start) {
      scriptName = 'start';
    } else {
      scriptName = Object.keys(scripts)[0] || 'dev';
    }
  }

  let detectedCommand = `${pm} run ${scriptName}`;
  if (pm === 'bun' && scriptName === 'dev') {
    detectedCommand = 'bun dev';
  } else if (pm === 'pnpm' && scriptName === 'dev') {
    detectedCommand = 'pnpm dev';
  }

  // Domain assignment according to PRD / config
  let suggestedDomain: string;
  if (type === 'frontend') {
    suggestedDomain = `${projectName}.${tld}`;
  } else if (type === 'backend') {
    suggestedDomain = `backend.${projectName}.${tld}`;
  } else {
    const safeName = path.basename(relativePath).replace(/[^a-zA-Z0-9-]/g, '-');
    suggestedDomain = `${safeName}.${projectName}.${tld}`;
  }

  const serviceName = path.basename(relativePath);

  return {
    name: serviceName,
    relativePath,
    type,
    framework,
    detectedCommand,
    suggestedDomain,
  };
}

/**
 * Scans candidate subdirectories and returns detected services.
 */
export async function detectServices(
  rootDir: string,
  projectName: string,
  tld: string = 'local'
): Promise<DetectedService[]> {
  const detected: DetectedService[] = [];

  for (const candidate of CANDIDATE_DIRS) {
    const fullPath = path.resolve(rootDir, candidate);
    if (existsSync(fullPath)) {
      const service = await analyzeDirectory(fullPath, candidate, projectName, rootDir, tld);
      if (service) {
        detected.push(service);
      }
    }
  }

  return detected;
}
