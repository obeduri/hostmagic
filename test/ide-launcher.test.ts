import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { SUPPORTED_IDES, launchIde } from '../src/core/ide-launcher.js';

console.log('Running IDE Launcher tests...');

// Test 1: Verify all required and recalled IDEs exist in registry
console.log('Test 1: Registry contains all requested IDEs');
const requiredIds = [
  'antigravity',
  'claude',
  'codex',
  'vscode',
  'cursor',
  'windsurf',
  'zed',
  'sublime',
  'notepadplusplus',
  'visualstudio',
  'webstorm',
  'datagrip',
  'pycharm',
  'intellij',
  'androidstudio',
  'phpstorm',
  'goland',
  'clion',
  'rider',
  'rubymine',
  'fleet',
  'terminal',
  'explorer',
];

for (const id of requiredIds) {
  const found = SUPPORTED_IDES.find((i) => i.id === id);
  assert.ok(found, `Expected ${id} to exist in SUPPORTED_IDES`);
  assert.ok(found.buttonLabel.startsWith('Open in '), `Expected ${id} buttonLabel to start with "Open in "`);
  assert.ok(found.iconSvg, `Expected ${id} to have an iconSvg defined`);
}

// Test 2: Validation of non-existent directory
console.log('Test 2: Non-existent directory returns failure');
const nonExistentPath = path.join(os.tmpdir(), `non-existent-dir-${Date.now()}`);
const nonExistentResult = await launchIde('vscode', nonExistentPath);
assert.strictEqual(nonExistentResult.success, false);
assert.ok(nonExistentResult.message.includes('Folder does not exist'));

// Test 3: Validation of unknown IDE ID
console.log('Test 3: Unknown IDE identifier returns failure');
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hostmagic-ide-test-'));
try {
  const unknownResult = await launchIde('totally-made-up-ide-12345', tempDir);
  assert.strictEqual(unknownResult.success, false);
  assert.ok(unknownResult.message.includes('Unknown IDE'));
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

console.log('✅ IDE Launcher tests passed successfully!');
