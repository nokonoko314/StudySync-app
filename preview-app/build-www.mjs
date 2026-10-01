// mockup.html をスマホ全画面アプリ用の www/index.html に変換する
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'mockup.html'), 'utf8');

const head = `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1C1F26">
<script>window.__STUDYSYNC_APP = true;</script>`;

const appCss = `<style id="app-mode-css">
html, body{height:100%; margin:0 !important; padding:0 !important; overflow:hidden; background:var(--bg) !important;}
body{display:block !important; min-height:0 !important; -webkit-tap-highlight-color:transparent; overscroll-behavior:none;}
.intro, .controls, .device-label, .notch, .statusbar, .home-indicator, #wrap-popups, #wrap-features, .footnote, .changelist{display:none !important;}
.frames{display:block !important; height:100%; gap:0 !important;}
.device-wrap{height:100%;}
.device-wrap.active{display:block !important;}
.device{width:100% !important; height:100% !important; border-radius:0 !important; padding:0 !important; box-shadow:none !important; background:var(--bg) !important;}
.screen{border-radius:0 !important; padding-top:env(safe-area-inset-top, 0px);}
.tabbar-float{bottom:calc(12px + env(safe-area-inset-bottom, 0px)) !important;}
.tabbar-float .tab{cursor:pointer; touch-action:manipulation;}
.app-back{
  position:absolute; z-index:80; top:calc(10px + env(safe-area-inset-top, 0px)); left:12px;
  min-height:40px; padding:0 14px 0 10px; border-radius:99px; border:1px solid var(--line);
  background:var(--surface); color:var(--ink); font:inherit; font-size:13px; font-weight:800;
  display:flex; align-items:center; gap:4px; box-shadow:var(--shadow-sm);
}
.app-back svg{width:16px; height:16px;}
</style>`;

const appJs = `<script id="app-mode-js">
(function(){
  const TAB_TARGET = { 'ホーム':'home', 'カレンダー':'calendar', '統計':'stats', '設定':'settings' };
  function stabFor(t){ return document.querySelector('.stab[data-target="' + t + '"]'); }
  let current = 'home';
  function show(target){
    const btn = stabFor(target);
    if(!btn) return;
    btn.click();
    document.querySelectorAll('.device-wrap.active .tabbar-float .tab').forEach(tab => {
      const label = tab.querySelector('span') ? tab.querySelector('span').textContent.trim() : '';
      tab.classList.toggle('active', TAB_TARGET[label] === target);
    });
  }
  document.querySelectorAll('.tabbar-float .tab').forEach(tab => {
    const label = tab.querySelector('span') ? tab.querySelector('span').textContent.trim() : '';
    const target = TAB_TARGET[label];
    if(!target) return;
    tab.setAttribute('role', 'button');
    tab.setAttribute('tabindex', '0');
    tab.addEventListener('click', () => show(target));
  });
  document.querySelectorAll('.stab').forEach(b => b.addEventListener('click', () => {
    current = b.dataset.target;
    if(current !== 'home' && !(history.state && history.state.target === current)) history.pushState({ target: current }, '');
  }));
  window.addEventListener('popstate', () => { show('home'); });

  const Cap = window.Capacitor;
  const plugins = Cap && Cap.Plugins ? Cap.Plugins : {};
  if(plugins.App){
    plugins.App.addListener('backButton', () => {
      if(window.StudySyncTour && window.StudySyncTour.active){ window.StudySyncTour.end(); return; }
      const openOverlay = document.querySelector('.device-wrap.active .overlay.show');
      if(openOverlay){
        const scrim = openOverlay.querySelector('.scrim');
        if(scrim) scrim.click(); else openOverlay.classList.remove('show');
        return;
      }
      if(current !== 'home'){ show('home'); return; }
      plugins.App.exitApp();
    });
  }
  // ステータスバーの色は、端末の設定だけでなくアプリ内のテーマ設定(常にライト/ダーク)にも合わせる
  function syncStatusBar(){
    if(!plugins.StatusBar) return;
    const bg = getComputedStyle(document.body).backgroundColor || 'rgb(28, 31, 38)';
    const [r, g, b] = (bg.match(/\\d+/g) || [28, 31, 38]).map(Number);
    const dark = (0.299 * r + 0.587 * g + 0.114 * b) < 128;
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    plugins.StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    plugins.StatusBar.setBackgroundColor({ color: hex }).catch(() => {});
    plugins.StatusBar.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => {});
  }
  syncStatusBar();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncStatusBar);
  new MutationObserver(() => requestAnimationFrame(syncStatusBar)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-wall', 'style'] });
})();
</script>`;

let out = src.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + head);
out = out.replace('</style>', '</style>\n' + appCss);
out = out.replace(/<\/body>\s*<\/html>\s*$/i, '') + '\n' + appJs + '\n';

mkdirSync(join(here, 'www'), { recursive: true });
writeFileSync(join(here, 'www', 'index.html'), out);
console.log('www/index.html written', out.length, 'bytes');

// Androidのバージョン番号を、アプリ内の表示(APP_VERSION)と同じにする。1.8.3 → versionCode 10803
const ver = (src.match(/const APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/) || []).slice(1).map(Number);
if (ver.length === 3) {
  const [major, minor, patch] = ver;
  writeFileSync(join(here, 'android', 'app', 'version.properties'),
    `versionName=${major}.${minor}.${patch}\nversionCode=${major * 10000 + minor * 100 + patch}\n`);
  console.log('android version', ver.join('.'));
}
