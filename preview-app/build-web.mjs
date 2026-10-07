// www/index.html(アプリ版)から、GitHub Pages で公開するブラウザ版 pages/app/index.html を作る。
// 先に node build-www.mjs を実行しておくこと
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let html = readFileSync(join(here, 'www', 'index.html'), 'utf8');
const shim = readFileSync(join(here, 'web-shim.js'), 'utf8');

const flag = '<script>window.__STUDYSYNC_APP = true;</script>';
if(!html.includes(flag)) throw new Error('app flag not found');
html = html.replace(flag, `${flag}\n<script>\n${shim}</script>`);
html = html.replace(/<title>[^<]*<\/title>/, '<title>StudySync</title>');

const out = join(here, '..', 'pages', 'app', 'index.html');
mkdirSync(dirname(out), { recursive:true });
writeFileSync(out, html);
console.log('pages/app/index.html written', html.length, 'bytes');
