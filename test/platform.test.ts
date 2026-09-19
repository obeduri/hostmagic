import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { getHostsPath, formatBlock, updateHostsContent, removeHostsContent, openHostsFile } from '../src/core/hosts.js';
import { flushDnsCache } from '../src/core/dns.js';
import { isProcessAlive, detectPreferredPort } from '../src/core/port-killer.js';

console.log('Running Cross-Platform Compatibility tests...');

// 1. Verify hosts file path resolution per platform
const hostsPath = getHostsPath();
if (process.platform === 'win32') {
  assert.ok(
    hostsPath.toLowerCase().includes('system32\\drivers\\etc\\hosts') ||
    hostsPath.toLowerCase().includes('system32/drivers/etc/hosts'),
    `Windows hosts path should point to System32/drivers/etc/hosts, got: ${hostsPath}`
  );
  console.log(`[Windows] Hosts path resolved correctly: ${hostsPath}`);
} else {
  assert.strictEqual(hostsPath, '/etc/hosts', `Unix hosts path should be /etc/hosts, got: ${hostsPath}`);
  console.log(`[Unix/macOS] Hosts path resolved correctly: ${hostsPath}`);
}

// 2. Verify hosts block formatting with OS-specific line endings
const domains = ['myapp.test', 'api.myapp.test'];
const block = formatBlock('myapp', domains);
assert.ok(block.includes('# BEGIN hostmagic:myapp'));
assert.ok(block.includes('127.0.0.1  myapp.test'));
assert.ok(block.includes('127.0.0.1  api.myapp.test'));
assert.ok(block.includes('# END hostmagic:myapp'));

// 3. Verify update and remove on Unix (\n) and Windows (\r\n) line endings
const unixHosts = '127.0.0.1 localhost\n::1 localhost\n';
const winHosts = '127.0.0.1 localhost\r\n::1 localhost\r\n';

const updatedUnix = updateHostsContent(unixHosts, 'myapp', domains);
assert.ok(updatedUnix.includes('# BEGIN hostmagic:myapp'));
assert.ok(!updatedUnix.includes('\r\n'), 'Unix hosts should not have CRLF');

const updatedWin = updateHostsContent(winHosts, 'myapp', domains);
assert.ok(updatedWin.includes('# BEGIN hostmagic:myapp'));
assert.ok(updatedWin.includes('\r\n'), 'Windows hosts should preserve CRLF');

const cleanedUnix = removeHostsContent(updatedUnix, 'myapp');
assert.ok(!cleanedUnix.includes('myapp.test'));
assert.strictEqual(cleanedUnix.trim(), '127.0.0.1 localhost\n::1 localhost');

// 4. Verify flushDnsCache does not throw unhandled exceptions
const flushed = await flushDnsCache();
console.log(`DNS flush executed cleanly (result: ${flushed})`);

// 5. Verify process life check
assert.strictEqual(isProcessAlive(process.pid), true);
assert.strictEqual(isProcessAlive(99999999), false);

// 6. Verify openHostsFile error handling with non-existent path
let threw = false;
try {
  await openHostsFile({ customPath: path.join(os.tmpdir(), 'non_existent_hosts_file_12345') });
} catch (err: any) {
  threw = true;
  assert.ok(err.message.includes('does not exist'));
}
assert.strictEqual(threw, true, 'openHostsFile should throw if hosts file does not exist');

// 7. Verify openHostsFile with a mock custom editor
const tempMockHosts = path.join(os.tmpdir(), `test_hosts_${Date.now()}`);
await fs.writeFile(tempMockHosts, '127.0.0.1 app.test\n', 'utf-8');
try {
  // Use node executable or a known command as custom editor
  const res = await openHostsFile({
    customPath: tempMockHosts,
    editor: process.execPath,
  });
  assert.strictEqual(res.path, tempMockHosts);
  assert.strictEqual(res.editor, process.execPath);
  console.log('openHostsFile with custom editor verified successfully');
} finally {
  await fs.unlink(tempMockHosts).catch(() => {});
}

console.log('✅ Cross-Platform Compatibility tests passed successfully!');

