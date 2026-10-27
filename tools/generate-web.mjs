#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] || 'examples/starter-project.json';
const outputDir = process.argv[3] || 'generated_web';
const project = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
function assert(ok, message) { if (!ok) throw new Error(message); }
assert(project.schemaVersion === 1, 'Unsupported schemaVersion; expected 1.');
assert(project.project && typeof project.project.name === 'string', 'Missing project.name.');
assert(Array.isArray(project.pages) && project.pages.length > 0, 'Project must contain at least one page.');
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const color = (value, fallback) => /^#[0-9a-fA-F]{6}$/.test(String(value ?? '')) ? String(value) : fallback;
const number = (value, fallback, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));
function renderNode(node) {
  const p = node.props || {};
  const label = esc(p.text ?? node.type);
  const fg = color(p.color, '#202124');
  const bg = color(p.background, '#f3f0fa');
  const size = number(p.fontSize, 16, 8, 72);
  const align = ['left','center','right'].includes(p.align) ? p.align : 'right';
  const children = Array.isArray(node.children) ? node.children.map(renderNode).join('\n') : '';
  switch (node.type) {
    case 'text': return `<p class="node text" style="color:${fg};font-size:${size}px;text-align:${align}">${label}</p>`;
    case 'button': return `<button class="node button" style="color:${fg};background:${bg};font-size:${size}px" onclick="alert('تم الضغط على الزر')">${label}</button>`;
    case 'input': return `<label class="node input-wrap"><span>${label}</span><input aria-label="${label}" placeholder="${label}"></label>`;
    case 'image': return `<div class="node image" style="background:${bg};color:${fg}"><span aria-hidden="true">▧</span><span>${label}</span><small>عنصر صورة تجريبي</small></div>`;
    case 'divider': return `<hr class="node divider" style="border-color:${fg}">`;
    case 'spacer': return `<div class="node spacer" style="height:${number(p.height,24,0,300)}px"></div>`;
    case 'row': return `<div class="node row" style="background:${bg};color:${fg}">${children || `<span>${label}</span>`}</div>`;
    case 'scroll': return `<div class="node scroll" style="background:${bg};color:${fg}">${children || `<span>${label}</span>`}</div>`;
    case 'card': return `<section class="node card" style="background:${bg};color:${fg}">${children || `<span>${label}</span>`}</section>`;
    case 'container': return `<section class="node container" style="background:${bg};color:${fg}">${children || `<span>${label}</span>`}</section>`;
    case 'column': case 'list': return `<div class="node column" style="color:${fg}">${children || `<span>${label}</span>`}</div>`;
    default: return `<p class="node">${label}</p>`;
  }
}
const pageMarkup = project.pages.map((page, index) => `<section class="page" data-page="${index}" ${index ? 'hidden' : ''}><h2>${esc(page.name)}</h2>${page.nodes.map(renderNode).join('\n') || '<p class="empty">هذه الصفحة فارغة.</p>'}</section>`).join('\n');
const tabs = project.pages.map((page, index) => `<button class="tab" data-target="${index}" aria-current="${index === 0 ? 'page' : 'false'}">${esc(page.name)}</button>`).join('\n');
const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.project.name)}</title>
<style>
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#202124;background:#f5f4f8}*{box-sizing:border-box}body{margin:0}.app{max-width:760px;min-height:100vh;margin:auto;background:#fff;box-shadow:0 8px 32px #0001}.appbar{padding:20px 22px;background:${color(project.project.themeColor,'#6750a4')};color:#fff;font-weight:700;font-size:20px}.tabs{display:flex;gap:8px;overflow:auto;padding:12px;border-bottom:1px solid #e6e2ec}.tab{border:1px solid #ded9e8;border-radius:999px;background:white;padding:9px 14px;white-space:nowrap}.tab[aria-current="page"]{background:#6750a4;color:white;border-color:#6750a4}.content{padding:18px}.page h2{font-size:18px;margin:0 0 14px}.node{margin:8px 0}.button{display:block;width:100%;border:0;border-radius:10px;padding:12px;cursor:pointer}.input-wrap{display:block}.input-wrap input{display:block;width:100%;padding:12px;border:1px solid #c9c5d0;border-radius:8px;margin-top:5px;font:inherit}.image{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:100px;border-radius:10px;padding:18px}.image small{width:100%;text-align:center}.divider{border:0;border-top:1px solid;margin:16px 0}.spacer{pointer-events:none}.card,.container{padding:14px;border-radius:12px;margin:10px 0}.card{box-shadow:0 2px 8px #0001}.column{display:flex;flex-direction:column;gap:6px}.row{display:flex;gap:8px;align-items:flex-start;padding:10px;border-radius:10px}.row>.node{flex:1;min-width:0}.scroll{max-height:260px;overflow:auto;padding:10px;border-radius:10px}.empty{color:#777;text-align:center;padding:30px}.footer{padding:14px;color:#777;font-size:12px;text-align:center;border-top:1px solid #eee}
</style></head><body><main class="app"><header class="appbar">${esc(project.project.name)}</header><nav class="tabs" aria-label="صفحات التطبيق">${tabs}</nav><div class="content">${pageMarkup}</div><footer class="footer">تم التوليد بواسطة AppForge Studio</footer></main>
<script>document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{const target=button.dataset.target;document.querySelectorAll('.page').forEach(page=>page.hidden=page.dataset.page!==target);document.querySelectorAll('.tab').forEach(tab=>tab.setAttribute('aria-current',tab===button?'page':'false'));}));</script></body></html>`;
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(outputDir, 'appforge-manifest.json'), JSON.stringify({schemaVersion:1,generator:'AppForge Studio Web',projectName:project.project.name,pageCount:project.pages.length},null,2));
fs.writeFileSync(path.join(outputDir, 'README.md'), `# ${project.project.name}\n\nنسخة ويب ثابتة مولّدة من AppForge Studio. افتح \`index.html\` في المتصفح أو ارفع مجلد المخرجات إلى استضافة صفحات ثابتة.\n`);
console.log(`Generated web app at ${outputDir}`);
