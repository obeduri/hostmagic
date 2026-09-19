import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { DetectedService, ServiceType } from '../types.js';

const CANDIDATE_DIRS = [
  'frontend',
  'backend',
  'client',
  'server',
  'web',
  'api',
  'app',
  'ui',
  'apps/web',
  'apps/api',
  'apps/client',
  'apps/server',
  'packages/web',
  'packages/api',
  'packages/client',
  'packages/server',
  'services/web',
  'services/api',
];

const FRONTEND_DEPS = [
  'next',
  'vite',
  'astro',
  'nuxt',
  'remix',
  '@remix-run/node',
  '@remix-run/react',
  '@sveltejs/kit',
  'svelte',
  'vue',
  '@angular/core',
  'solid-js',
  '@builder.io/qwik',
  'react',
  'preact',
  'gatsby',
  '@tanstack/react-router',
  '@tanstack/start',
];

const BACKEND_DEPS = [
  '@nestjs/core',
  'express',
  'fastify',
  'koa',
  'hono',
  '@adonisjs/core',
  'hapi',
  '@hapi/hapi',
  'polka',
  'strapi',
  '@strapi/strapi',
  'typeorm',
  'prisma',
  '@prisma/client',
  'drizzle-orm',
  'feathers',
  '@feathersjs/feathers',
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
 * Checks whether a root directory is a monorepo workspace meta-root rather than a standalone app.
 */
export async function isLikelyMonorepoRoot(rootDir: string): Promise<boolean> {
  const pkgPath = path.join(rootDir, 'package.json');
  try {
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    if (pkg.workspaces) return true;
  } catch {}

  if (
    existsSync(path.join(rootDir, 'pnpm-workspace.yaml')) ||
    existsSync(path.join(rootDir, 'lerna.json')) ||
    existsSync(path.join(rootDir, 'turbo.json')) ||
    existsSync(path.join(rootDir, 'nx.json'))
  ) {
    return true;
  }

  return false;
}

/**
 * Inspects a folder's package.json to classify service type, framework and command.
 */
export async function analyzeDirectory(
  fullPath: string,
  relativePath: string,
  projectName: string,
  rootDir: string,
  tld: string = 'test'
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

  const isRoot = relativePath === '.' || relativePath === '' || relativePath === './';
  const lowerRel = relativePath.toLowerCase();

  // Heuristic based on dependencies first, then folder naming
  if (detectedFrontend) {
    type = 'frontend';
    framework = detectedFrontend;
  } else if (detectedBackend) {
    type = 'backend';
    framework = detectedBackend;
  } else if (lowerRel.includes('front') || lowerRel.includes('client') || lowerRel.includes('web') || lowerRel.includes('ui')) {
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
  if (scripts[scriptName]) {
    if (pm === 'bun' && scriptName === 'dev') {
      detectedCommand = 'bun dev';
    } else if (pm === 'pnpm' && scriptName === 'dev') {
      detectedCommand = 'pnpm dev';
    }
  } else {
    // If no scripts found, fallback to entry file if present
    const entry =
      pkg.main ||
      (existsSync(path.join(fullPath, 'server.js')) ? 'server.js' : undefined) ||
      (existsSync(path.join(fullPath, 'index.js')) ? 'index.js' : undefined) ||
      (existsSync(path.join(fullPath, 'server.ts')) ? 'server.ts' : undefined) ||
      (existsSync(path.join(fullPath, 'src/index.ts')) ? 'src/index.ts' : undefined) ||
      (existsSync(path.join(fullPath, 'src/index.js')) ? 'src/index.js' : undefined);

    if (entry) {
      detectedCommand = pm === 'bun' ? `bun ${entry}` : `node ${entry}`;
    }
  }

  // Domain assignment according to PRD / config
  let suggestedDomain: string;
  if (isRoot) {
    // Standalone projects in the root directory always route to the primary project domain
    suggestedDomain = `${projectName}.${tld}`;
  } else if (type === 'frontend') {
    suggestedDomain = `${projectName}.${tld}`;
  } else if (type === 'backend') {
    suggestedDomain = `backend.${projectName}.${tld}`;
  } else {
    const safeName = path.basename(relativePath).replace(/[^a-zA-Z0-9-]/g, '-');
    suggestedDomain = `${safeName}.${projectName}.${tld}`;
  }

  let serviceName: string;
  if (isRoot) {
    const cleanPkgName =
      typeof pkg.name === 'string'
        ? pkg.name.replace(/^@[^/]+\//, '').replace(/[^a-zA-Z0-9_-]/g, '-')
        : '';
    serviceName = cleanPkgName || projectName || (type === 'frontend' ? 'frontend' : type === 'backend' ? 'backend' : 'app');
  } else {
    serviceName = path.basename(relativePath);
  }

  return {
    name: serviceName,
    relativePath: isRoot ? '.' : relativePath,
    type,
    framework,
    detectedCommand,
    suggestedDomain,
  };
}

/**
 * Scans candidate subdirectories and root directory, returning detected services.
 * Supports:
 * 1. Traditional multi-service repos (frontend/ and backend/ subdirectories).
 * 2. Standalone single-folder projects (Next.js, Astro, Vite, Express, Fastify, NestJS, etc. directly in root).
 */
export async function detectServices(
  rootDir: string,
  projectName: string,
  tld: string = 'test'
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

  // Check if root directory itself is a standalone service or complementary service
  const rootPkgPath = path.join(rootDir, 'package.json');
  if (existsSync(rootPkgPath)) {
    if (detected.length === 0) {
      // Standalone single-folder project (Next.js, Astro, Vite, Express, etc. in root)
      const rootService = await analyzeDirectory(rootDir, '.', projectName, rootDir, tld);
      if (rootService) {
        detected.push(rootService);
      }
    } else {
      // Subdirectories were detected. Check if root is an app frontend with a backend subdir, or vice versa
      const isMonorepo = await isLikelyMonorepoRoot(rootDir);
      if (!isMonorepo) {
        const rootService = await analyzeDirectory(rootDir, '.', projectName, rootDir, tld);
        if (rootService) {
          const hasFrontendSubdir = detected.some((d) => d.type === 'frontend');
          const hasBackendSubdir = detected.some((d) => d.type === 'backend');

          if (rootService.type === 'frontend' && !hasFrontendSubdir) {
            detected.unshift(rootService);
          } else if (rootService.type === 'backend' && !hasBackendSubdir) {
            detected.push(rootService);
          }
        }
      }
    }
  }

  return detected;
}
