import assert from 'node:assert';
import http from 'node:http';
import { ReverseProxyServer } from '../src/core/proxy.js';
import getPort from 'get-port';

console.log('Running Reverse Proxy tests...');

// 1. Setup mock frontend server
const frontPort = await getPort();
const frontServer = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/auth/signin/google')) {
    res.writeHead(302, {
      Location:
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=client123&redirect_uri=http://myapp.test/api/auth/callback/google&response_type=code',
    });
    res.end();
    return;
  }
  if (req.url?.startsWith('/api/auth/callback/google')) {
    res.writeHead(302, {
      Location: '/user-dashboard',
      'Set-Cookie': [
        'next-auth.session-token=secret-token-123; Path=/; Secure',
        'next-auth.csrf=xyz; Path=/',
      ],
    });
    res.end();
    return;
  }
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

// 3. Setup mock second project frontend server
const frontPort2 = await getPort();
const frontServer2 = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'app2-frontend', path: req.url }));
});
await new Promise<void>((resolve) => frontServer2.listen(frontPort2, '127.0.0.1', () => resolve()));

// 4. Setup ReverseProxyServer on test port and auxiliary OAuth bridge port
const proxyPort = await getPort();
const oauthBridgePort = await getPort();
const proxy = new ReverseProxyServer({
  name: 'myapp',
  routes: [
    { domain: 'myapp.test', targetPort: frontPort },
    { domain: 'backend.myapp.test', targetPort: backPort },
  ],
  frontendPort: frontPort,
});
await proxy.start(proxyPort, oauthBridgePort);

try {
  // Test 1: Route to frontend by Host header
  console.log('Test 1: Proxy routing to frontend');
  const res1 = await fetch(`http://127.0.0.1:${proxyPort}/home`, {
    headers: { Host: 'myapp.test' },
  });
  assert.strictEqual(res1.status, 200);
  const data1 = (await res1.json()) as any;
  assert.strictEqual(data1.service, 'frontend');
  assert.strictEqual(data1.path, '/home');

  // Test 2: Route to backend by Host header
  console.log('Test 2: Proxy routing to backend');
  const res2 = await fetch(`http://127.0.0.1:${proxyPort}/api/v1/users`, {
    headers: { Host: 'backend.myapp.test' },
  });
  assert.strictEqual(res2.status, 200);
  const data2 = (await res2.json()) as any;
  assert.strictEqual(data2.service, 'backend');
  assert.strictEqual(data2.path, '/api/v1/users');

  // Test 3: Route localhost header to single active frontend
  console.log('Test 3: Proxy routing localhost to single frontend');
  const res3 = await fetch(`http://127.0.0.1:${proxyPort}/profile`, {
    headers: { Host: 'localhost' },
  });
  assert.strictEqual(res3.status, 200);
  const data3 = (await res3.json()) as any;
  assert.strictEqual(data3.service, 'frontend');
  assert.strictEqual(data3.path, '/profile');

  // Test 4: Gateway discovery helper
  console.log('Test 4: isGatewayRunning detection');
  const isRunning = await ReverseProxyServer.isGatewayRunning(proxyPort);
  assert.strictEqual(isRunning, true);

  // Test 5: Dynamic registration of second project (multi-project concurrency)
  console.log('Test 5: Registering second project dynamically');
  const registered = await ReverseProxyServer.registerWithGateway(proxyPort, {
    name: 'second-app',
    routes: [{ domain: 'second-app.test', targetPort: frontPort2 }],
    frontendPort: frontPort2,
  });
  assert.strictEqual(registered, true);

  // Test 6: Route to second project domain concurrently
  console.log('Test 6: Routing to second project domain concurrently');
  const res6 = await fetch(`http://127.0.0.1:${proxyPort}/dashboard`, {
    headers: { Host: 'second-app.test' },
  });
  assert.strictEqual(res6.status, 200);
  const data6 = (await res6.json()) as any;
  assert.strictEqual(data6.service, 'app2-frontend');
  assert.strictEqual(data6.path, '/dashboard');

  // First project is still routing perfectly
  const res6_first = await fetch(`http://127.0.0.1:${proxyPort}/home`, {
    headers: { Host: 'myapp.test' },
  });
  assert.strictEqual(res6_first.status, 200);

  // Test 7: Gateway Hub serves the interactive dashboard
  console.log('Test 7: Localhost serves Gateway Hub at /__hostmagic');
  const res7 = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic`, {
    headers: { Host: 'localhost' },
  });
  assert.strictEqual(res7.status, 200);
  const hubHtml = await res7.text();
  assert.ok(hubHtml.includes('Hostmagic Gateway'));
  assert.ok(hubHtml.includes('myapp.test'));
  assert.ok(hubHtml.includes('second-app.test'));

  // Test 8: Unregister second project cleanly
  console.log('Test 8: Clean unregistration of second project');
  const unregistered = await ReverseProxyServer.unregisterFromGateway(proxyPort, 'second-app');
  assert.strictEqual(unregistered, true);

  // After unregistration, second project is 404
  const res8 = await fetch(`http://127.0.0.1:${proxyPort}/dashboard`, {
    headers: { Host: 'second-app.test' },
  });
  assert.strictEqual(res8.status, 404);

  // And localhost reverts back to first project frontend automatically
  const res9 = await fetch(`http://127.0.0.1:${proxyPort}/home`, {
    headers: { Host: 'localhost' },
  });
  assert.strictEqual(res9.status, 200);
  const data9 = (await res9.json()) as any;
  assert.strictEqual(data9.service, 'frontend');

  // Test 10: OAuth Initiation Rewrite (Rewrites .test redirect_uri to localhost:3000)
  console.log('Test 10: OAuth initiation rewrite (.test -> localhost:3000)');
  const res10 = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/signin/google`, {
    headers: { Host: 'myapp.test' },
    redirect: 'manual',
  });
  assert.strictEqual(res10.status, 302);
  const rewrittenGoogleUrl = res10.headers.get('location') || '';
  assert.ok(
    rewrittenGoogleUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle') ||
    rewrittenGoogleUrl.includes('redirect_uri=http://localhost:3000/api/auth/callback/google'),
    `Google redirect_uri must be rewritten to localhost:3000, got: ${rewrittenGoogleUrl}`
  );
  assert.ok(!rewrittenGoogleUrl.includes('myapp.test'), 'Google redirect_uri must not contain .test domain');

  // Test 11: Universal OAuth Callback Interception on auxiliary bridge port (e.g. port 3000) -> Direct 302 to .test domain
  console.log('Test 11: OAuth callback on auxiliary bridge port redirects directly to .test domain');
  const res11 = await fetch(`http://127.0.0.1:${oauthBridgePort}/api/auth/callback/google?code=test-code`, {
    headers: { Host: 'localhost:3000' },
    redirect: 'manual',
  });
  assert.strictEqual(res11.status, 302);
  const targetLocation = res11.headers.get('location') || '';
  assert.strictEqual(
    targetLocation,
    'http://myapp.test/api/auth/callback/google?code=test-code',
    `Callback must redirect directly to myapp.test, got: ${targetLocation}`
  );

  // Test 12: Browser follows redirect to .test domain and frontend completes auth natively
  console.log('Test 12: Browser follows redirect to .test domain and frontend completes auth natively');
  const parsedTarget = new URL(targetLocation);
  const res12 = await fetch(`http://127.0.0.1:${proxyPort}${parsedTarget.pathname}${parsedTarget.search}`, {
    headers: { Host: 'myapp.test' },
    redirect: 'manual',
  });
  assert.strictEqual(res12.status, 302);
  assert.strictEqual(res12.headers.get('location'), '/user-dashboard');
  const cookies = res12.headers.get('set-cookie') || '';
  assert.ok(cookies.includes('next-auth.session-token=secret-token-123'), 'Session token must be set on .test');

  // Test 12b: OAuth Callback on port 80 localhost also redirects cleanly to .test domain
  console.log('Test 12b: OAuth callback on port 80 localhost redirects to .test domain');
  const res12b = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/callback/github?code=gh-code-123`, {
    headers: { Host: 'localhost' },
    redirect: 'manual',
  });
  assert.strictEqual(res12b.status, 302);
  assert.strictEqual(
    res12b.headers.get('location'),
    'http://myapp.test/api/auth/callback/github?code=gh-code-123'
  );

  // Test 13: Intuitive localhost routing by Referer header & port parameter
  console.log('Test 13: Intuitive localhost routing by Referer & port parameter');
  await ReverseProxyServer.registerWithGateway(proxyPort, {
    name: 'second-app',
    routes: [{ domain: 'second-app.test', targetPort: frontPort2 }],
    frontendPort: frontPort2,
  });

  const res13 = await fetch(`http://127.0.0.1:${proxyPort}/home`, {
    headers: {
      Host: 'localhost',
      Referer: 'http://second-app.test/dashboard',
    },
  });
  assert.strictEqual(res13.status, 200);
  const data13 = (await res13.json()) as any;
  assert.strictEqual(data13.service, 'app2-frontend');

  const res14 = await fetch(`http://127.0.0.1:${proxyPort}/home?port=${frontPort}`, {
    headers: { Host: 'localhost' },
  });
  assert.strictEqual(res14.status, 200);
  const data14 = (await res14.json()) as any;
  assert.strictEqual(data14.service, 'frontend');

  // Test 15: Hostmagic Settings domain (http://hostmagic.settings)
  console.log('Test 15: hostmagic.settings serves interactive settings dashboard');
  const res15 = await fetch(`http://127.0.0.1:${proxyPort}/`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(res15.status, 200);
  const settingsHtml = await res15.text();
  assert.ok(settingsHtml.includes('hostmagic.settings'), 'Must display hostmagic.settings badge');
  assert.ok(settingsHtml.includes('id="logModal"'), 'Must contain native HTML dialog for logs');
  assert.ok(settingsHtml.includes('id="addModal"'), 'Must contain native HTML dialog for adding routes');

  // Test 16: REST API status
  console.log('Test 16: REST API status endpoint');
  const res16 = await fetch(`http://127.0.0.1:${proxyPort}/api/status`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(res16.status, 200);
  const statusData = (await res16.json()) as any;
  assert.strictEqual(statusData.hostmagic, true);
  assert.ok(Array.isArray(statusData.routes));
  assert.ok(statusData.routes.some((r: any) => r.domain === 'myapp.test'));

  // Test 17: Log ingestion and retrieval
  console.log('Test 17: Live log buffering and API retrieval');
  ReverseProxyServer.appendLog('myapp.test', '[TEST] Log line 1 for myapp.test');
  const pushRes = await fetch(`http://127.0.0.1:${proxyPort}/api/logs/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Host: 'hostmagic.settings' },
    body: JSON.stringify({ target: 'myapp.test', lines: ['[TEST] Log line 2 via push API'] }),
  });
  assert.strictEqual(pushRes.status, 200);

  const logsRes = await fetch(`http://127.0.0.1:${proxyPort}/api/logs?target=myapp.test`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(logsRes.status, 200);
  const logsData = (await logsRes.json()) as any;
  assert.strictEqual(logsData.target, 'myapp.test');
  assert.ok(logsData.logs.includes('[TEST] Log line 1 for myapp.test'));
  assert.ok(logsData.logs.includes('[TEST] Log line 2 via push API'));

  // Test 18: Dynamic Route Addition
  console.log('Test 18: Dynamically add new route via API');
  const addRouteRes = await fetch(`http://127.0.0.1:${proxyPort}/api/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Host: 'hostmagic.settings' },
    body: JSON.stringify({
      projectName: 'dynamic-app',
      serviceName: 'web',
      domain: 'dynamic-service.test',
      targetPort: backPort,
      type: 'backend',
    }),
  });
  assert.strictEqual(addRouteRes.status, 200);

  // Verify dynamic route now routes traffic to backPort
  const dynamicReq = await fetch(`http://127.0.0.1:${proxyPort}/api/test`, {
    headers: { Host: 'dynamic-service.test' },
  });
  assert.strictEqual(dynamicReq.status, 200);
  const dynData = (await dynamicReq.json()) as any;
  assert.strictEqual(dynData.service, 'backend');

  // Test 19: Dynamic Route Deletion
  console.log('Test 19: Dynamically delete route via API');
  const delRouteRes = await fetch(`http://127.0.0.1:${proxyPort}/api/routes`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Host: 'hostmagic.settings' },
    body: JSON.stringify({ domain: 'dynamic-service.test', projectName: 'dynamic-app' }),
  });
  assert.strictEqual(delRouteRes.status, 200);

  // Verify dynamic route now returns 404
  const deletedReq = await fetch(`http://127.0.0.1:${proxyPort}/api/test`, {
    headers: { Host: 'dynamic-service.test' },
  });
  assert.strictEqual(deletedReq.status, 404);

  // Test 20: Hot-refresh of settings dashboard template
  console.log('Test 20: Hot-refresh settings dashboard via refreshSettingsOnGateway');
  const customMockTemplate = `<!DOCTYPE html><html><head><title>Hot Refreshed Dashboard</title></head><body><h1>🧙‍♂️ Custom In-Memory Reload</h1><span id="metricDomains">{{DOMAIN_COUNT}}</span></body></html>`;
  const refreshOk = await ReverseProxyServer.refreshSettingsOnGateway(proxyPort, customMockTemplate);
  assert.strictEqual(refreshOk, true);

  const refreshedReq = await fetch(`http://127.0.0.1:${proxyPort}/`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(refreshedReq.status, 200);
  const refreshedHtml = await refreshedReq.text();
  assert.ok(refreshedHtml.includes('Hot Refreshed Dashboard'));
  assert.ok(refreshedHtml.includes('Custom In-Memory Reload'));

  // Reset template back to default
  ReverseProxyServer.setDashboardTemplate('');

  console.log('✅ Reverse Proxy, Gateway, Settings Dashboard, and OAuth Bridge tests passed successfully!');
} finally {
  await proxy.stop();
  await new Promise<void>((resolve) => frontServer.close(() => resolve()));
  await new Promise<void>((resolve) => backServer.close(() => resolve()));
  await new Promise<void>((resolve) => frontServer2.close(() => resolve()));
}
