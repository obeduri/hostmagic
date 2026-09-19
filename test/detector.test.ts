import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { detectServices } from '../src/core/detector.js';

console.log('Running detector tests...');

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-detect-test-'));

try {
  // Test 1: Multi-service project with frontend and backend subdirectories
  console.log('Test 1: Multi-service project with frontend and backend subdirectories');
  const frontDir = path.join(tempDir, 'frontend');
  await fs.mkdir(frontDir, { recursive: true });
  await fs.writeFile(
    path.join(frontDir, 'package.json'),
    JSON.stringify({
      name: 'my-frontend',
      scripts: { dev: 'vite' },
      dependencies: { react: '^18.0.0' },
      devDependencies: { vite: '^5.0.0' },
    })
  );

  const backDir = path.join(tempDir, 'backend');
  await fs.mkdir(backDir, { recursive: true });
  await fs.writeFile(
    path.join(backDir, 'package.json'),
    JSON.stringify({
      name: 'my-backend',
      scripts: { dev: 'nest start --watch' },
      dependencies: { '@nestjs/core': '^10.0.0' },
    })
  );

  const detected = await detectServices(tempDir, 'super-app');

  assert.strictEqual(detected.length, 2, 'Should detect both frontend and backend');

  const front = detected.find((d) => d.name === 'frontend');
  assert.ok(front, 'Frontend should be found');
  assert.strictEqual(front.type, 'frontend');
  assert.strictEqual(front.suggestedDomain, 'super-app.test');
  assert.strictEqual(front.framework, 'vite');

  const back = detected.find((d) => d.name === 'backend');
  assert.ok(back, 'Backend should be found');
  assert.strictEqual(back.type, 'backend');
  assert.strictEqual(back.suggestedDomain, 'backend.super-app.test');
  assert.strictEqual(back.framework, '@nestjs/core');

  // Test 2: Standalone Next.js app in root directory
  console.log('Test 2: Standalone Next.js app in root directory');
  const nextDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-next-test-'));
  try {
    await fs.writeFile(
      path.join(nextDir, 'package.json'),
      JSON.stringify({
        name: 'reparando',
        scripts: { dev: 'next dev' },
        dependencies: { next: '14.2.0', react: '^18.0.0' },
      })
    );

    const nextDetected = await detectServices(nextDir, 'reparando');
    assert.strictEqual(nextDetected.length, 1, 'Should detect single root Next.js service');
    assert.strictEqual(nextDetected[0].relativePath, '.');
    assert.strictEqual(nextDetected[0].type, 'frontend');
    assert.strictEqual(nextDetected[0].framework, 'next');
    assert.strictEqual(nextDetected[0].suggestedDomain, 'reparando.test');
    assert.strictEqual(nextDetected[0].name, 'reparando');
  } finally {
    await fs.rm(nextDir, { recursive: true, force: true });
  }

  // Test 3: Standalone Astro app in root directory
  console.log('Test 3: Standalone Astro app in root directory');
  const astroDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-astro-test-'));
  try {
    await fs.writeFile(
      path.join(astroDir, 'package.json'),
      JSON.stringify({
        name: 'my-astro-blog',
        scripts: { dev: 'astro dev' },
        dependencies: { astro: '^4.0.0' },
      })
    );

    const astroDetected = await detectServices(astroDir, 'my-astro-blog');
    assert.strictEqual(astroDetected.length, 1, 'Should detect single root Astro service');
    assert.strictEqual(astroDetected[0].relativePath, '.');
    assert.strictEqual(astroDetected[0].type, 'frontend');
    assert.strictEqual(astroDetected[0].framework, 'astro');
    assert.strictEqual(astroDetected[0].suggestedDomain, 'my-astro-blog.test');
  } finally {
    await fs.rm(astroDir, { recursive: true, force: true });
  }

  // Test 4: Standalone Express API in root directory
  console.log('Test 4: Standalone Express API in root directory');
  const expressDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-express-test-'));
  try {
    await fs.writeFile(
      path.join(expressDir, 'package.json'),
      JSON.stringify({
        name: 'abogando-api',
        scripts: { dev: 'node server.js' },
        dependencies: { express: '^4.19.0', cors: '^2.8.5' },
      })
    );

    const expressDetected = await detectServices(expressDir, 'abogando-api');
    assert.strictEqual(expressDetected.length, 1, 'Should detect single root Express service');
    assert.strictEqual(expressDetected[0].relativePath, '.');
    assert.strictEqual(expressDetected[0].type, 'backend');
    assert.strictEqual(expressDetected[0].framework, 'express');
    // Standalone express app at root should get clean primary project domain
    assert.strictEqual(expressDetected[0].suggestedDomain, 'abogando-api.test');
    assert.strictEqual(expressDetected[0].name, 'abogando-api');
  } finally {
    await fs.rm(expressDir, { recursive: true, force: true });
  }

  // Test 5: Monorepo root with workspaces should not duplicate services
  console.log('Test 5: Monorepo with workspaces and packages/web, packages/api');
  const monorepoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-monorepo-test-'));
  try {
    await fs.writeFile(
      path.join(monorepoDir, 'package.json'),
      JSON.stringify({
        name: 'monorepo-root',
        workspaces: ['packages/*'],
        devDependencies: { turbo: '^1.10.0' },
      })
    );
    const webDir = path.join(monorepoDir, 'packages', 'web');
    await fs.mkdir(webDir, { recursive: true });
    await fs.writeFile(
      path.join(webDir, 'package.json'),
      JSON.stringify({
        name: 'web',
        scripts: { dev: 'vite' },
        devDependencies: { vite: '^5.0.0' },
      })
    );
    const apiDir = path.join(monorepoDir, 'packages', 'api');
    await fs.mkdir(apiDir, { recursive: true });
    await fs.writeFile(
      path.join(apiDir, 'package.json'),
      JSON.stringify({
        name: 'api',
        scripts: { dev: 'node index.js' },
        dependencies: { fastify: '^4.0.0' },
      })
    );

    const monorepoDetected = await detectServices(monorepoDir, 'monorepo-app');
    assert.strictEqual(monorepoDetected.length, 2, 'Should detect only the 2 workspace services');
    assert.ok(monorepoDetected.some((d) => d.name === 'web' && d.type === 'frontend'));
    assert.ok(monorepoDetected.some((d) => d.name === 'api' && d.type === 'backend'));
  } finally {
    await fs.rm(monorepoDir, { recursive: true, force: true });
  }

  console.log('✅ All detector tests passed successfully!');
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
