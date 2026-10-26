import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
test('generator creates Flutter source files from starter JSON', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'appforge-test-'));
  const result = spawnSync(process.execPath, ['tools/generate-flutter.mjs', 'examples/starter-project.json', tmp], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(tmp, 'lib/main.dart')));
  assert.ok(fs.existsSync(path.join(tmp, 'pubspec.yaml')));
  const dart = fs.readFileSync(path.join(tmp, 'lib/main.dart'), 'utf8');
  assert.match(dart, /class AppForgeApp/);
  assert.match(dart, /NavigationBar/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
test('generator rejects unsupported schema version', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'appforge-invalid-'));
  const input = path.join(tmp, 'bad.json');
  fs.writeFileSync(input, JSON.stringify({ schemaVersion: 42 }));
  const result = spawnSync(process.execPath, ['tools/generate-flutter.mjs', input, path.join(tmp, 'out')], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  fs.rmSync(tmp, { recursive: true, force: true });
});
