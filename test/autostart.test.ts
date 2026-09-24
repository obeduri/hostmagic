import assert from 'node:assert';
import getPort from 'get-port';
import { ReverseProxyServer } from '../src/core/proxy.js';
import {
  isAutostartEnabled,
  enableAutostart,
  disableAutostart,
  getAutostartStatus,
} from '../src/core/autostart.js';

console.log('Running Hostmagic OS Autostart tests...');

// 1. Test Core Autostart Functions
console.log('Test 1: getAutostartStatus returns valid structure');
const initialStatus = await getAutostartStatus();
assert.strictEqual(typeof initialStatus.enabled, 'boolean');
assert.strictEqual(typeof initialStatus.platform, 'string');
assert.ok(initialStatus.platform.length > 0);

console.log('Test 2: enableAutostart and disableAutostart cycle');
const enableRes = await enableAutostart();
assert.strictEqual(enableRes.success, true);
const enabledCheck = await isAutostartEnabled();
assert.strictEqual(enabledCheck, true);

const disableRes = await disableAutostart();
assert.strictEqual(disableRes.success, true);
const disabledCheck = await isAutostartEnabled();
assert.strictEqual(disabledCheck, false);

// 2. Test Gateway REST API Endpoints
console.log('Test 3: Gateway GET /__hostmagic/api/autostart');
const gatewayPort = await getPort();
const gateway = new ReverseProxyServer();
await gateway.start(gatewayPort);

try {
  const getRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/autostart`);
  assert.strictEqual(getRes.status, 200);
  const getData = (await getRes.json()) as any;
  assert.strictEqual(getData.success, true);
  assert.strictEqual(typeof getData.enabled, 'boolean');

  console.log('Test 4: Gateway POST /__hostmagic/api/autostart (enable)');
  const postEnableRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/autostart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });
  assert.strictEqual(postEnableRes.status, 200);
  const postEnableData = (await postEnableRes.json()) as any;
  assert.strictEqual(postEnableData.success, true);
  assert.strictEqual(postEnableData.enabled, true);

  console.log('Test 5: Gateway POST /__hostmagic/api/autostart (disable)');
  const postDisableRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/autostart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false }),
  });
  assert.strictEqual(postDisableRes.status, 200);
  const postDisableData = (await postDisableRes.json()) as any;
  assert.strictEqual(postDisableData.success, true);
  assert.strictEqual(postDisableData.enabled, false);

  // 3. Test Per-Project Autostart
  console.log('Test 6: POST /__hostmagic/api/projects/autostart enables autostart for project');
  const projAutostartRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects/autostart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'obeduri', autostart: true }),
  });
  assert.strictEqual(projAutostartRes.status, 200);
  const projAutostartData = (await projAutostartRes.json()) as any;
  assert.strictEqual(projAutostartData.success, true);
  assert.strictEqual(projAutostartData.autostart, true);

  console.log('Test 7: Projects API reflects autostart flag');
  const projListRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects`);
  assert.strictEqual(projListRes.status, 200);
  const projListData = (await projListRes.json()) as any;
  const obedProj = projListData.projects.find((p: any) => p.name === 'obeduri');
  assert.ok(obedProj);
  assert.strictEqual(obedProj.autostart, true);

  console.log('Test 8: POST /__hostmagic/api/projects/autostart disables autostart');
  const disableProjRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/projects/autostart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'obeduri', autostart: false }),
  });
  assert.strictEqual(disableProjRes.status, 200);
  const disableProjData = (await disableProjRes.json()) as any;
  assert.strictEqual(disableProjData.success, true);
  assert.strictEqual(disableProjData.autostart, false);

  console.log('Test 9: gateway.autoStartProjects() executes cleanly');
  const origStart = gateway.startProjectByNameOrPath.bind(gateway);
  gateway.startProjectByNameOrPath = async (name: string) => ({ success: true, project: name });
  const autoStarted = await gateway.autoStartProjects();
  assert.ok(Array.isArray(autoStarted));
  gateway.startProjectByNameOrPath = origStart;

  console.log('✅ All Hostmagic OS Autostart & Project Autostart tests passed successfully!');
} finally {
  await gateway.stop();
  await disableAutostart();
}
