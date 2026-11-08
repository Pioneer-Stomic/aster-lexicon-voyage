import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const displacement = fs.readFileSync(path.join(root, 'displacement.b64'), 'utf8').trim();
const files = ['src/app-core.jsx', 'src/app-study.jsx', 'src/app-pages.jsx', 'src/app-modals.jsx'];
const app = files.map((file) => {
  const body = fs.readFileSync(path.join(root, file), 'utf8');
  return `\n/* ===== ${file} ===== */\n${body}`;
}).join('\n');
const html = template
  .replace('/*__APP__*/', () => app)
  .replace('__DISPLACEMENT_MAP__', () => displacement);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`Built index.html: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
