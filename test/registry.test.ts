import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import getPort from 'get-port';
import { ReverseProxyServer } from '../src/core/proxy.js';
import {
  registerProjectInGlobalRegistry,
  getKnownProjects,
  unregisterProjectFromGlobalRegistry,
} from '../src/core/registry.js';
import type { HostmagicConfig } from '../src/types.js';

console.log('Running Hostmagic Registry and Dashboard Project Management tests...');

// 1. Test Registry Persistence
console.log('Test 1: Register and retrieve projects from global registry');
const mockProjectDir = path.join(os.tmpdir(), `hostmagic_test_${Date.now()}`);
let mockProjectDir2: string | undefined;
await fs.mkdir(mockProjectDir, { recursive: true });

const mockConfig: HostmagicConfig = {
  name: 'unit-test-proj',
  tld: 'test',
  services: [
    {
      name: 'frontend',
      path: '.',
      type: 'frontend',
      domain: 'unit-test-proj.test',
      command: 'echo "frontend running"',
      port: 58123,
    },
    {
      name: 'backend',
      path: '.',
      type: 'backend',
      domain: 'api.unit-test-proj.test',
      command: 'echo "backend running"',
      port: 58124,
    },
  ],
};

await fs.writeFile(
  path.join(mockProjectDir, '.hostmagic.json'),
  JSON.stringify(mockConfig, null, 2),
  'utf-8'
);

await registerProjectInGlobalRegistry(mockConfig, mockProjectDir);

const known = await getKnownProjects();
const found = known.find((p) => p.name === 'unit-test-proj');
assert.ok(found, 'Project should be found in known projects');
assert.strictEqual(found.services.length, 2);
assert.strictEqual(found.services[0].domain, 'unit-test-proj.test');

// 2. Test Gateway Dashboard Projects API
console.log('Test 2: Gateway GET /__hostmagic/api/projects');
const gatewayPort = await getPort();
const oauthPort = await getPort();
const gateway = new ReverseProxyServer();
await gateway.start(gatewayPort, oauthPort);

try {
  const res = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects`);
  assert.strictEqual(res.status, 200);
  const data = (await res.json()) as any;
  assert.strictEqual(data.hostmagic, true);
  assert.ok(Array.isArray(data.projects));

  const proj = data.projects.find((p: any) => p.name === 'unit-test-proj');
  assert.ok(proj, 'unit-test-proj should appear in dashboard projects');
  assert.strictEqual(proj.status, 'stopped', 'Initial status should be stopped');

  // Test 3: Import project via API POST /__hostmagic/api/projects/add
  console.log('Test 3: POST /__hostmagic/api/projects/add');
  mockProjectDir2 = path.join(os.tmpdir(), `hostmagic_test2_${Date.now()}`);
  await fs.mkdir(mockProjectDir2, { recursive: true });
  const mockConfig2: HostmagicConfig = {
    name: 'imported-app',
    tld: 'test',
    services: [
      {
        name: 'web',
        path: '.',
        type: 'frontend',
        domain: 'imported-app.test',
        command: 'echo "web running"',
        port: 58199,
      },
    ],
  };
  await fs.writeFile(
    path.join(mockProjectDir2, '.hostmagic.json'),
    JSON.stringify(mockConfig2, null, 2),
    'utf-8'
  );

  const addRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: mockProjectDir2 }),
  });
  assert.strictEqual(addRes.status, 200);
  const addData = (await addRes.json()) as any;
  assert.strictEqual(addData.success, true);
  assert.strictEqual(addData.project.name, 'imported-app');

  // Verify it appears in projects list
  const res2 = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects`);
  const data2 = (await res2.json()) as any;
  assert.ok(data2.projects.some((p: any) => p.name === 'imported-app'));

  // Test 4: Delete/Forget project via DELETE /__hostmagic/api/projects
  console.log('Test 4: DELETE /__hostmagic/api/projects');
  const delRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'imported-app' }),
  });
  assert.strictEqual(delRes.status, 200);

  const res3 = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects`);
  const data3 = (await res3.json()) as any;
  assert.strictEqual(data3.projects.some((p: any) => p.name === 'imported-app'), false);

  // Clean up test 1
  await unregisterProjectFromGlobalRegistry('unit-test-proj');

  // Test 5: pickFolderDialog module export
  console.log('Test 5: pickFolderDialog module check');
  const { pickFolderDialog } = await import('../src/core/dialog.js');
  assert.strictEqual(typeof pickFolderDialog, 'function');

  console.log('✅ All Hostmagic Registry and Dashboard Project tests passed successfully!');
} finally {
  await gateway.stop();
  await fs.rm(mockProjectDir, { recursive: true, force: true }).catch(() => {});
  if (mockProjectDir2) {
    await fs.rm(mockProjectDir2, { recursive: true, force: true }).catch(() => {});
  }
}
