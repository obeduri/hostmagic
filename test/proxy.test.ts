import assert from 'node:assert';
import http from 'node:http';
import { ReverseProxyServer } from '../src/core/proxy.js';
import getPort from 'get-port';

console.log('Running Reverse Proxy tests...');

// 1. Setup mock frontend server
const frontPort = await getPort();
const frontServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'frontend', path: req.url }));
});
await new Promise<void>((resolve) => frontServer.listen(frontPort, '127.0.0.1', () => resolve()));

// 2. Setup mock backend server
const backPort = await getPort();
const backServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'backend', path: req.url }));
});
await new Promise<void>((resolve) => backServer.listen(backPort, '127.0.0.1', () => resolve()));

// 3. Setup ReverseProxyServer on test port
const proxyPort = await getPort();
const proxy = new ReverseProxyServer([
  { domain: 'myapp.local', targetPort: frontPort },
  { domain: 'backend.myapp.local', targetPort: backPort },
]);
await proxy.start(proxyPort);

try {
  // Test 1: Route to frontend by Host header
  console.log('Test 1: Proxy routing to frontend');
  const res1 = await fetch(`http://127.0.0.1:${proxyPort}/home`, {
    headers: { Host: 'myapp.local' },
  });
  assert.strictEqual(res1.status, 200);
  const data1 = await res1.json() as any;
  assert.strictEqual(data1.service, 'frontend');
  assert.strictEqual(data1.path, '/home');

  // Test 2: Route to backend by Host header
  console.log('Test 2: Proxy routing to backend');
  const res2 = await fetch(`http://127.0.0.1:${proxyPort}/api/v1/users`, {
    headers: { Host: 'backend.myapp.local' },
  });
  assert.strictEqual(res2.status, 200);
  const data2 = await res2.json() as any;
  assert.strictEqual(data2.service, 'backend');
  assert.strictEqual(data2.path, '/api/v1/users');

  // Test 3: Unknown host returns 404
  console.log('Test 3: Proxy handling unknown host');
  const res3 = await fetch(`http://127.0.0.1:${proxyPort}/`, {
    headers: { Host: 'unknown.local' },
  });
  assert.strictEqual(res3.status, 404);

  console.log('✅ Reverse Proxy tests passed successfully!');
} finally {
  await proxy.stop();
  await new Promise<void>((resolve) => frontServer.close(() => resolve()));
  await new Promise<void>((resolve) => backServer.close(() => resolve()));
}
