import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('web generator emits a multi-page static app and escapes text', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'appforge-web-test-'));
  const input = path.join(tmp, 'project.json');
  const output = path.join(tmp, 'out');
  fs.writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    project: { id: 'p', name: 'Test <App>', packageName: 'com.example.test', themeColor: '#6750a4' },
    pages: [
      { id: 'home', name: 'Home', nodes: [{ id: 'a', type: 'text', props: { text: '<script>alert(1)</script>' } }] },
      { id: 'second', name: 'Second', nodes: [{ id: 'b', type: 'column', props: {}, children: [{ id: 'c', type: 'button', props: { text: 'Go' } }] }] }
    ]
  }));
  const result = spawnSync(process.execPath, ['tools/generate-web.mjs', input, output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /data-page="1"/);
  assert.match(html, /addEventListener/);
  assert.ok(fs.existsSync(path.join(output, 'appforge-manifest.json')));
  fs.rmSync(tmp, { recursive: true, force: true });
});
