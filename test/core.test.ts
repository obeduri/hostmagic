import assert from 'node:assert';
import { formatBlock, updateHostsContent, removeHostsContent } from '../src/core/hosts.js';
import { allocateUniquePorts } from '../src/core/port.js';

console.log('Running tests for Hostmagic...');

// Test 1: formatBlock
console.log('Test 1: formatBlock');
const formatted = formatBlock('test-proj', ['app.local', 'api.test-proj.local']);
assert.ok(formatted.includes('# BEGIN hostmagic:test-proj'));
assert.ok(formatted.includes('127.0.0.1  app.local'));
assert.ok(formatted.includes('127.0.0.1  api.test-proj.local'));
assert.ok(formatted.includes('# END hostmagic:test-proj'));

// Test 2: updateHostsContent appends when not present
console.log('Test 2: updateHostsContent (append)');
const initialHosts = '127.0.0.1 localhost\n::1 localhost';
const updatedHosts = updateHostsContent(initialHosts, 'test-proj', ['test-proj.local']);
assert.ok(updatedHosts.includes('127.0.0.1 localhost'));
assert.ok(updatedHosts.includes('# BEGIN hostmagic:test-proj'));
assert.ok(updatedHosts.includes('127.0.0.1  test-proj.local'));
assert.ok(updatedHosts.includes('# END hostmagic:test-proj'));

// Test 3: updateHostsContent updates existing block without duplication
console.log('Test 3: updateHostsContent (update existing)');
const updatedAgain = updateHostsContent(updatedHosts, 'test-proj', ['new.test-proj.local']);
assert.ok(updatedAgain.includes('127.0.0.1  new.test-proj.local'));
assert.ok(!updatedAgain.includes('127.0.0.1  test-proj.local'));
const occurrences = (updatedAgain.match(/# BEGIN hostmagic:test-proj/g) || []).length;
assert.strictEqual(occurrences, 1, 'Should only have 1 block for test-proj');

// Test 4: removeHostsContent for specific project
console.log('Test 4: removeHostsContent (project specific)');
const otherProjectHosts = updateHostsContent(updatedAgain, 'other-proj', ['other.local']);
const cleanedHosts = removeHostsContent(otherProjectHosts, 'test-proj');
assert.ok(!cleanedHosts.includes('hostmagic:test-proj'));
assert.ok(cleanedHosts.includes('hostmagic:other-proj'));
assert.ok(cleanedHosts.includes('127.0.0.1 localhost'));

// Test 5: removeHostsContent for all projects
console.log('Test 5: removeHostsContent (all projects)');
const cleanedAll = removeHostsContent(otherProjectHosts, '*');
assert.ok(!cleanedAll.includes('hostmagic'));
assert.ok(cleanedAll.includes('127.0.0.1 localhost'));

// Test 6: allocateUniquePorts
console.log('Test 6: allocateUniquePorts');
const ports = await allocateUniquePorts(3);
assert.strictEqual(ports.length, 3);
assert.strictEqual(new Set(ports).size, 3, 'All allocated ports must be unique');
for (const p of ports) {
  assert.ok(p > 1024 && p < 65535, `Port ${p} is in valid ephemeral range`);
}

console.log('✅ All tests passed successfully!');
