import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import getPort from 'get-port';
import {
  findProcessOnPort,
  detectPreferredPort,
  checkAndCleanNextLock,
  isProcessAlive,
} from '../src/core/port-killer.js';

console.log('Running Port Killer tests...');

// 1. Process Identification
const testPort = await getPort();
const server = http.createServer((req, res) => res.end('ok'));
await new Promise<void>((resolve) => server.listen(testPort, '0.0.0.0', () => resolve()));

try {
  const proc = await findProcessOnPort(testPort);
  assert.ok(proc !== null, `Should find process on port ${testPort}`);
  assert.strictEqual(proc.pid, process.pid, `Should match current process PID ${process.pid}`);
  console.log(`Successfully identified process on port ${testPort}: PID ${proc.pid} (${proc.name})`);
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

// After server is closed, port should be free
const procAfter = await findProcessOnPort(testPort);
assert.strictEqual(procAfter, null, 'Port should be free after server is closed');

// 2. isProcessAlive test
assert.strictEqual(isProcessAlive(process.pid), true, 'Current process should be alive');
assert.strictEqual(isProcessAlive(9999999), false, 'Non-existent PID should not be alive');

// 3. detectPreferredPort test
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hm-test-'));
try {
  // Test existing port preservation
  const p1 = await detectPreferredPort(tmpDir, 'frontend', 'next', 42150);
  assert.strictEqual(p1, 42150, 'Configured port should be preserved');

  // Test no hardcoded default (returns undefined so random unique 40000+ port is allocated)
  const p2 = await detectPreferredPort(tmpDir, 'frontend', 'next');
  assert.strictEqual(p2, undefined, 'Should not default to 3000/3001');

  // 4. Stale Next.js lock cleaning test
  const lockDir = path.join(tmpDir, '.next', 'dev');
  await fs.mkdir(lockDir, { recursive: true });
  const lockFile = path.join(lockDir, 'lock');
  // Write a stale lock with a dead PID
  await fs.writeFile(lockFile, JSON.stringify({ pid: 9999999, port: 58993 }), 'utf-8');

  await checkAndCleanNextLock(tmpDir, true);
  let lockExists = false;
  try {
    await fs.access(lockFile);
    lockExists = true;
  } catch {}
  assert.strictEqual(lockExists, false, 'Stale .next/dev/lock should be automatically cleaned');
} finally {
  await fs.rm(tmpDir, { recursive: true, force: true });
}

console.log('✅ Port Killer tests passed successfully!');
