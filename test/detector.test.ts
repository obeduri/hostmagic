import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { detectServices } from '../src/core/detector.js';

console.log('Running detector tests...');

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-detect-test-'));

try {
  // Create mock frontend directory with vite
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

  // Create mock backend directory with nestjs
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
  assert.strictEqual(front.suggestedDomain, 'super-app.local');
  assert.strictEqual(front.framework, 'vite');

  const back = detected.find((d) => d.name === 'backend');
  assert.ok(back, 'Backend should be found');
  assert.strictEqual(back.type, 'backend');
  assert.strictEqual(back.suggestedDomain, 'backend.super-app.local');
  assert.strictEqual(back.framework, '@nestjs/core');

  console.log('✅ Detector tests passed successfully!');
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
