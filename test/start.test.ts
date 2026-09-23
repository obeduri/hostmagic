import assert from 'node:assert';
import http from 'node:http';
import getPort from 'get-port';
import { ReverseProxyServer } from '../src/core/proxy.js';

console.log('Running Hostmagic Start & Standalone Gateway tests...');

// 1. Setup mock backend service
const servicePort = await getPort();
const serviceServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'api-service', url: req.url }));
});
await new Promise<void>((resolve) => serviceServer.listen(servicePort, '127.0.0.1', () => resolve()));

// 2. Start standalone ReverseProxyServer gateway on dynamic ports (simulating `hm start`)
const gatewayPort = await getPort();
const oauthPort = await getPort();
const gateway = new ReverseProxyServer();
await gateway.start(gatewayPort, oauthPort);

try {
  // Test 1: isGatewayRunning detects active gateway
  console.log('Test 1: isGatewayRunning detects running standalone gateway');
  const running = await ReverseProxyServer.isGatewayRunning(gatewayPort);
  assert.strictEqual(running, true);

  // Test 2: hostmagic.settings serves HTML dashboard
  console.log('Test 2: hostmagic.settings serves settings dashboard HTML');
  const settingsRes = await fetch(`http://127.0.0.1:${gatewayPort}/`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(settingsRes.status, 200);
  const html = await settingsRes.text();
  assert.ok(html.includes('Hostmagic'));
  assert.ok(html.includes('Settings'));

  // Test 3: Status API reports empty initial routes
  console.log('Test 3: /__hostmagic/status reports initial state');
  const statusRes = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/status`);
  assert.strictEqual(statusRes.status, 200);
  const statusData = (await statusRes.json()) as any;
  assert.strictEqual(statusData.hostmagic, true);
  assert.strictEqual(statusData.projects.length, 0);

  // Test 4: Register project with standalone gateway
  console.log('Test 4: Register project with standalone gateway');
  const registered = await ReverseProxyServer.registerWithGateway(gatewayPort, {
    name: 'test-app',
    routes: [
      {
        domain: 'api.test-app.test',
        targetPort: servicePort,
        serviceName: 'backend',
        type: 'backend',
      },
    ],
  });
  assert.strictEqual(registered, true);

  // Test 5: Verify proxy routes to registered service
  console.log('Test 5: Standalone gateway routes incoming traffic to registered service');
  const proxyRes = await fetch(`http://127.0.0.1:${gatewayPort}/v1/status`, {
    headers: { Host: 'api.test-app.test' },
  });
  assert.strictEqual(proxyRes.status, 200);
  const proxyData = (await proxyRes.json()) as any;
  assert.strictEqual(proxyData.service, 'api-service');
  assert.strictEqual(proxyData.url, '/v1/status');

  // Test 6: Status API reflects newly registered project
  console.log('Test 6: REST API status reflects registered project');
  const statusRes2 = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/api/status`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(statusRes2.status, 200);
  const statusData2 = (await statusRes2.json()) as any;
  assert.strictEqual(statusData2.projects.length, 1);
  assert.strictEqual(statusData2.projects[0].name, 'test-app');
  assert.strictEqual(statusData2.routes.length, 1);
  assert.strictEqual(statusData2.routes[0].domain, 'api.test-app.test');

  // Test 7: Unregister project
  console.log('Test 7: Unregister project from standalone gateway');
  const unregistered = await ReverseProxyServer.unregisterFromGateway(gatewayPort, 'test-app');
  assert.strictEqual(unregistered, true);

  const statusRes3 = await fetch(`http://127.0.0.1:${gatewayPort}/__hostmagic/status`);
  const statusData3 = (await statusRes3.json()) as any;
  assert.strictEqual(statusData3.projects.length, 0);

  console.log('✅ All Hostmagic Start & Standalone Gateway tests passed successfully!');
} finally {
  await gateway.stop();
  await new Promise<void>((resolve) => serviceServer.close(() => resolve()));
}
