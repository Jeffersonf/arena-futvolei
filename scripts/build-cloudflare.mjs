import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.cloudflare-public');
const files = [
  'index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'service-worker.js',
  'aluno.html', 'student-fast.js', 'autorizar.html', 'authorize-fast.js'
];

fs.mkdirSync(output, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log(`Cloudflare assets ready: ${files.length} files`);
