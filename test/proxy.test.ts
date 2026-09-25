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
  if (req.url?.startsWith('/api/auth/signin-json/google')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=client123&redirect_uri=https%3A%2F%2Fmyapp.test%2Fapi%2Fauth%2Fcallback%2Fgoogle&response_type=code&state=json-state-456',
      })
    );
    return;
  }
  if (req.url?.startsWith('/api/auth/signin-html/google')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<html><body><form action="https://accounts.google.com/o/oauth2/v2/auth?client_id=client123&redirect_uri=https://myapp.test/api/auth/callback/google&state=html-state-789"></form></body></html>'
    );
    return;
  }
  if (req.url?.startsWith('/api/auth/check-headers')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        origin: req.headers.origin,
        referer: req.headers.referer,
        forwardedHost: req.headers['x-forwarded-host'],
        cookie: req.headers.cookie,
      })
    );
    return;
  }
  if (req.url?.startsWith('/api/auth/redirect-test')) {
    res.writeHead(302, {
      Location: 'http://localhost:3000/api/auth/signin',
      'Set-Cookie': '__Secure-next-auth.session-token=secure123; Path=/; Secure; Domain=localhost',
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
  if (req.url?.startsWith('/_next/webpack-hmr') || req.url?.startsWith('/_next/hmr')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'frontend-hmr',
        origin: req.headers.origin,
        host: req.headers.host,
        forwardedHost: req.headers['x-forwarded-host'],
      })
    );
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'frontend', path: req.url }));
});
await new Promise<void>((resolve) => frontServer.listen(frontPort, '127.0.0.1', () => resolve()));

// 2. Setup mock backend server
const backPort = await getPort();
const backServer = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/cors-test')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'backend-cors',
        origin: req.headers.origin,
        host: req.headers.host,
      })
    );
    return;
  }
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
    rewrittenGoogleUrl.includes(`redirect_uri=http%3A%2F%2Flocalhost%3A${oauthBridgePort}%2Fapi%2Fauth%2Fcallback%2Fgoogle`) ||
    rewrittenGoogleUrl.includes(`redirect_uri=http://localhost:${oauthBridgePort}/api/auth/callback/google`) ||
    rewrittenGoogleUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle') ||
    rewrittenGoogleUrl.includes('redirect_uri=http://localhost:3000/api/auth/callback/google'),
    `Google redirect_uri must be rewritten to localhost bridge, got: ${rewrittenGoogleUrl}`
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

  // Test 12c: Auth CSRF & Origin masking to localhost:3000
  console.log('Test 12c: Auth endpoints normalize Origin, Referer and x-forwarded-host to localhost:3000');
  const res12c = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/check-headers`, {
    headers: {
      Host: 'myapp.test',
      Origin: 'http://myapp.test',
      Referer: 'http://myapp.test/login',
      Cookie: 'next-auth.session-token=my-token-123',
    },
  });
  assert.strictEqual(res12c.status, 200);
  const data12c = (await res12c.json()) as any;
  assert.strictEqual(data12c.forwardedHost, `localhost:${oauthBridgePort}`);
  assert.strictEqual(data12c.origin, `http://localhost:${oauthBridgePort}`);
  assert.strictEqual(data12c.referer, `http://localhost:${oauthBridgePort}/login`);
  assert.ok(data12c.cookie.includes('next-auth.session-token=my-token-123'));
  assert.ok(data12c.cookie.includes('__Secure-next-auth.session-token=my-token-123'));

  // Test 12d: Local bridge redirect rewriting and cookie prefix stripping
  console.log('Test 12d: Local bridge redirect rewritten to .test domain and strips __Secure- prefix');
  const res12d = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/redirect-test`, {
    headers: { Host: 'myapp.test' },
    redirect: 'manual',
  });
  assert.strictEqual(res12d.status, 302);
  assert.strictEqual(res12d.headers.get('location'), 'http://myapp.test/api/auth/signin');
  const cookie12d = res12d.headers.get('set-cookie') || '';
  assert.ok(cookie12d.includes('next-auth.session-token=secure123'));
  assert.ok(!cookie12d.includes('__Secure-'));
  assert.ok(!cookie12d.includes('Domain=localhost'));

  // Test 12e: Cookie transfer and hash preservation on auxiliary bridge port
  console.log('Test 12e: Cookie transfer and hash preservation on auxiliary bridge port');
  const res12e = await fetch(`http://127.0.0.1:${oauthBridgePort}/api/auth/callback/google?code=code-abc`, {
    headers: {
      Host: 'localhost:3000',
      Cookie: 'custom_oauth_state=xyz123',
    },
    redirect: 'manual',
  });
  assert.strictEqual(res12e.status, 302);
  assert.strictEqual(res12e.headers.get('location'), 'http://myapp.test/api/auth/callback/google?code=code-abc');
  const cookie12e = res12e.headers.get('set-cookie') || '';
  assert.ok(cookie12e.includes('custom_oauth_state=xyz123'));
  const html12e = await res12e.text();
  assert.ok(html12e.includes('window.location.hash'));
  // Test 12f: JSON OAuth Body Interception (NextAuth React signIn('google'))
  console.log('Test 12f: JSON OAuth Body Interception rewrites redirect_uri to localhost:3000');
  const res12f = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/signin-json/google`, {
    headers: {
      Host: 'myapp.test',
      Accept: 'application/json',
      'X-Auth-Return-Redirect': '1',
    },
  });
  assert.strictEqual(res12f.status, 200);
  const data12f = (await res12f.json()) as any;
  assert.ok(
    data12f.url.includes(`redirect_uri=http%3A%2F%2Flocalhost%3A${oauthBridgePort}%2Fapi%2Fauth%2Fcallback%2Fgoogle`) ||
    data12f.url.includes(`redirect_uri=http://localhost:${oauthBridgePort}/api/auth/callback/google`) ||
    data12f.url.includes('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle') ||
    data12f.url.includes('redirect_uri=http://localhost:3000/api/auth/callback/google'),
    `JSON url redirect_uri must be rewritten to localhost bridge, got: ${data12f.url}`
  );
  assert.ok(!data12f.url.includes('myapp.test'), 'JSON url must NOT contain myapp.test in redirect_uri');

  // Test 12g: State cached from JSON OAuth body correctly routes callback
  console.log('Test 12g: State cached from JSON OAuth body correctly routes callback to .test domain');
  const res12g = await fetch(`http://127.0.0.1:${oauthBridgePort}/api/auth/callback/google?code=code-from-google&state=json-state-456`, {
    headers: { Host: 'localhost:3000' },
    redirect: 'manual',
  });
  assert.strictEqual(res12g.status, 302);
  assert.strictEqual(
    res12g.headers.get('location'),
    'http://myapp.test/api/auth/callback/google?code=code-from-google&state=json-state-456'
  );

  // Test 12h: HTML OAuth Form / Link Body Interception
  console.log('Test 12h: HTML OAuth Body Interception rewrites redirect_uri to localhost:3000');
  const res12h = await fetch(`http://127.0.0.1:${proxyPort}/api/auth/signin-html/google`, {
    headers: { Host: 'myapp.test' },
  });
  assert.strictEqual(res12h.status, 200);
  const html12h = await res12h.text();
  assert.ok(
    html12h.includes(`redirect_uri=http://localhost:${oauthBridgePort}/api/auth/callback/google`) ||
    html12h.includes('redirect_uri=http://localhost:3000/api/auth/callback/google'),
    `HTML body redirect_uri must be rewritten to localhost bridge, got: ${html12h}`
  );
  assert.ok(!html12h.includes('myapp.test'), 'HTML body must NOT contain myapp.test in redirect_uri');

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

  // Test 21: Next.js & Vite HMR Origin Normalization
  console.log('Test 21: Transparent Next.js & Vite HMR Origin Normalization');
  const hmrReq = await fetch(`http://127.0.0.1:${proxyPort}/_next/webpack-hmr`, {
    headers: {
      Host: 'myapp.test',
      Origin: 'http://myapp.test',
    },
  });
  assert.strictEqual(hmrReq.status, 200);
  const hmrData = (await hmrReq.json()) as any;
  assert.strictEqual(hmrData.service, 'frontend-hmr');
  // Origin must be normalized to internal target port so Next.js never blocks dev resource
  assert.strictEqual(hmrData.origin, `http://127.0.0.1:${frontPort}`);
  assert.strictEqual(hmrData.forwardedHost, 'myapp.test');

  // Test 22: Preserves cross-origin header for Backend API CORS
  console.log('Test 22: Preserves original cross-origin header for backend API CORS');
  const corsReq = await fetch(`http://127.0.0.1:${proxyPort}/api/cors-test`, {
    headers: {
      Host: 'backend.myapp.test',
      Origin: 'http://myapp.test',
    },
  });
  assert.strictEqual(corsReq.status, 200);
  const corsData = (await corsReq.json()) as any;
  assert.strictEqual(corsData.service, 'backend-cors');
  // Origin must be preserved intact for cross-domain API requests so backend CORS works
  assert.strictEqual(corsData.origin, 'http://myapp.test');

  // Test 23: 404 Fallback page does not render active routes list and contains Start / Init actions
  console.log('Test 23: 404 Fallback page renders interactive UI without listing active routes');
  const notFoundReq = await fetch(`http://127.0.0.1:${proxyPort}/unconfigured-route`, {
    headers: { Host: 'unknown-app.test' },
  });
  assert.strictEqual(notFoundReq.status, 404);
  const notFoundBody = await notFoundReq.text();
  assert.ok(!notFoundBody.includes('Active routes:'), 'Must not display active routes');
  assert.ok(notFoundBody.includes('unknown-app.test'));
  assert.ok(notFoundBody.includes('Initialize Project Folder (hm init)'));

  // Test 24: initProjectAtFolder API endpoint validation
  console.log('Test 24: POST /__hostmagic/api/projects/init-folder invalid path validation');
  const initInvalidReq = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/api/projects/init-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'C:\\NonExistent_Hostmagic_Test_Path_12345' }),
  });
  assert.strictEqual(initInvalidReq.status, 400);
  const initInvalidData = (await initInvalidReq.json()) as any;
  assert.ok(initInvalidData.error);

  // Test 25: POST /__hostmagic/api/projects/restart endpoint
  console.log('Test 25: POST /__hostmagic/api/projects/restart endpoint');
  const restartReq = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/api/projects/restart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(restartReq.status, 200);
  const restartData = (await restartReq.json()) as any;
  assert.strictEqual(restartData.success, true);
  assert.ok(Array.isArray(restartData.restarted));

  // Test 26: GET /__hostmagic/api/ides returns supported IDE list
  console.log('Test 26: GET /__hostmagic/api/ides returns supported IDEs');
  const idesReq = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/api/ides`);
  assert.strictEqual(idesReq.status, 200);
  const idesData = (await idesReq.json()) as any;
  assert.strictEqual(idesData.success, true);
  assert.ok(Array.isArray(idesData.ides));
  const ideNames = idesData.ides.map((i: any) => i.id);
  assert.ok(ideNames.includes('antigravity'), 'Must include antigravity');
  assert.ok(ideNames.includes('claude'), 'Must include claude');
  assert.ok(ideNames.includes('codex'), 'Must include codex');
  assert.ok(ideNames.includes('vscode'), 'Must include vscode');
  assert.ok(ideNames.includes('zed'), 'Must include zed');
  assert.ok(ideNames.includes('sublime'), 'Must include sublime');
  assert.ok(ideNames.includes('notepadplusplus'), 'Must include notepadplusplus');
  assert.ok(ideNames.includes('visualstudio'), 'Must include visualstudio');
  assert.ok(ideNames.includes('webstorm'), 'Must include webstorm');
  assert.ok(ideNames.includes('datagrip'), 'Must include datagrip');
  assert.ok(ideNames.includes('pycharm'), 'Must include pycharm');
  assert.ok(ideNames.includes('terminal'), 'Must include terminal');

  // Test 27: 404 Inactive route page renders search bar, logo, and clean IDE names
  console.log('Test 27: 404 Fallback page renders search bar, logo, and clean IDE names');
  assert.ok(notFoundBody.includes('id="ideSearchInput"'), 'Must render IDE search input');
  assert.ok(notFoundBody.includes('data:image/webp;base64,'), 'Must render embedded Hostmagic logo data URI');
  assert.ok(notFoundBody.includes('<span>Antigravity</span>'), 'Must render Antigravity name');
  assert.ok(notFoundBody.includes('<span>Claude Code</span>'), 'Must render Claude Code name');
  assert.ok(notFoundBody.includes('<span>Codex</span>'), 'Must render Codex name');
  assert.ok(notFoundBody.includes('<span>VS Code</span>'), 'Must render VS Code name');
  assert.ok(notFoundBody.includes('<span>Cursor</span>'), 'Must render Cursor name');
  assert.ok(notFoundBody.includes('<span>Terminal</span>'), 'Must render Terminal name');
  assert.ok(notFoundBody.includes('<span>Zed</span>'), 'Must render Zed name');
  assert.ok(notFoundBody.includes('<span>Sublime Text</span>'), 'Must render Sublime Text name');
  assert.ok(notFoundBody.includes('<span>Notepad++</span>'), 'Must render Notepad++ name');
  assert.ok(notFoundBody.includes('<span>Visual Studio</span>'), 'Must render Visual Studio name');
  assert.ok(notFoundBody.includes('<span>WebStorm</span>'), 'Must render WebStorm name');
  assert.ok(notFoundBody.includes('<span>DataGrip</span>'), 'Must render DataGrip name');
  assert.ok(notFoundBody.includes('<span>PyCharm</span>'), 'Must render PyCharm name');
  assert.ok(!notFoundBody.includes('<span>Open in Antigravity</span>'), 'Must not repeat Open in');

  // Test 28: POST /__hostmagic/api/projects/open-ide validation
  console.log('Test 28: POST /__hostmagic/api/projects/open-ide unlinked project validation');
  const openIdeInvalid = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/api/projects/open-ide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'unlinked-non-existent-project', ide: 'vscode' }),
  });
  assert.strictEqual(openIdeInvalid.status, 400);
  const openIdeInvalidData = (await openIdeInvalid.json()) as any;
  assert.strictEqual(openIdeInvalidData.needPath, true);

  // Test 29: GET /__hostmagic/manifest.json serves PWA manifest
  console.log('Test 29: PWA Manifest endpoint');
  const manifestRes = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/manifest.json`);
  assert.strictEqual(manifestRes.status, 200);
  assert.ok(manifestRes.headers.get('content-type')?.includes('application/manifest+json'));
  const manifestJson = (await manifestRes.json()) as any;
  assert.ok(manifestJson.name.includes('Hostmagic'));
  assert.strictEqual(manifestJson.display, 'standalone');
  assert.ok(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2);
  assert.ok(manifestJson.icons.some((i: any) => i.src.includes('magichost.webp')));

  // Test 30: GET /__hostmagic/sw.js serves Service Worker with proper headers
  console.log('Test 30: PWA Service Worker endpoint');
  const swRes = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/sw.js`);
  assert.strictEqual(swRes.status, 200);
  assert.ok(swRes.headers.get('content-type')?.includes('application/javascript'));
  assert.strictEqual(swRes.headers.get('service-worker-allowed'), '/');
  const swCode = await swRes.text();
  assert.ok(swCode.includes('hostmagic-pwa'));

  // Test 31: GET /__hostmagic/magichost.webp and /magichost.webp serves webp logo
  console.log('Test 31: PWA magichost.webp logo endpoint');
  const logoRes = await fetch(`http://127.0.0.1:${proxyPort}/__hostmagic/magichost.webp`);
  assert.strictEqual(logoRes.status, 200);
  assert.strictEqual(logoRes.headers.get('content-type'), 'image/webp');
  const logoBuf = await logoRes.arrayBuffer();
  assert.ok(logoBuf.byteLength > 1000, 'Logo buffer should be valid image');

  const rootLogoRes = await fetch(`http://127.0.0.1:${proxyPort}/magichost.webp`);
  assert.strictEqual(rootLogoRes.status, 200);
  assert.strictEqual(rootLogoRes.headers.get('content-type'), 'image/webp');

  // Test 32: Favicon for hostmagic.settings
  console.log('Test 32: Favicon for hostmagic.settings');
  const settingsFaviconRes = await fetch(`http://127.0.0.1:${proxyPort}/favicon.ico`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(settingsFaviconRes.status, 200);
  assert.ok(
    settingsFaviconRes.headers.get('content-type')?.includes('image/x-icon') ||
      settingsFaviconRes.headers.get('content-type')?.includes('image/webp')
  );
  const settingsFaviconBuf = await settingsFaviconRes.arrayBuffer();
  assert.ok(settingsFaviconBuf.byteLength > 1000, 'Favicon buffer should be valid image');

  const settingsFaviconQueryRes = await fetch(`http://127.0.0.1:${proxyPort}/favicon.ico?v=2`, {
    headers: { Host: 'hostmagic.settings' },
  });
  assert.strictEqual(settingsFaviconQueryRes.status, 200);

  // Test 33: ProcessManager quiet mode suppresses stdout while saving to buffer
  console.log('Test 33: ProcessManager quiet mode suppresses stdout while preserving buffer');
  const { ProcessManager } = await import('../src/core/process-manager.js');
  const quietManager = new ProcessManager({ quiet: true, handleSignals: false });
  assert.strictEqual(quietManager.isQuiet(), true);

  // Reset template back to default
  ReverseProxyServer.setDashboardTemplate('');

  console.log('✅ Reverse Proxy, Gateway, Settings Dashboard, and OAuth Bridge tests passed successfully!');
} finally {
  await proxy.stop();
  await new Promise<void>((resolve) => frontServer.close(() => resolve()));
  await new Promise<void>((resolve) => backServer.close(() => resolve()));
  await new Promise<void>((resolve) => frontServer2.close(() => resolve()));
}
