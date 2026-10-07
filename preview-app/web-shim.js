// ブラウザ版(GitHub Pages)用: Android版のネイティブ部品(Capacitorプラグイン)と同じ呼び方で、
// Firebase の Web SDK と Google Identity Services を使えるようにする。アプリ本体のコードはそのまま使う
(function(){
  if(window.Capacitor) return;
  // Firebase の Web 用の設定(ウェブページに公開して使うための値)
  const FIREBASE = {
    apiKey:'AIzaSyDGWALCbccOMtV8IPBtYppmEQhFQxwyjDI',
    authDomain:'studysync-73a0f.firebaseapp.com',
    projectId:'studysync-73a0f',
    storageBucket:'studysync-73a0f.firebasestorage.app',
    messagingSenderId:'513488495547',
    appId:'1:513488495547:web:fe0b68cd72a0b011bb9a9e',
  };
  // Googleカレンダーの許可に使う OAuth クライアント(ウェブ アプリケーション)
  const WEB_CLIENT_ID = '513488495547-1samdo06q1vcte6ge22rdkn3ifgdv5pv.apps.googleusercontent.com';
  const FB = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const TOKEN_KEY = 'studysync.web.gtoken';

  const load = src => new Promise((ok, ng) => {
    const s = document.createElement('script');
    s.src = src; s.async = false; s.onload = ok; s.onerror = () => ng(new Error('network: ' + src));
    document.head.appendChild(s);
  });
  // 起動と同時に読み込んでおく(ログインのボタンを押した直後にポップアップを開けるように)
  const ready = load(FB + 'firebase-app-compat.js')
    .then(() => Promise.all([load(FB + 'firebase-auth-compat.js'), load(FB + 'firebase-firestore-compat.js')]))
    .then(() => {
      const app = firebase.initializeApp(FIREBASE);
      const auth = app.auth(), db = app.firestore();
      return { auth, db, first:new Promise(r => { const off = auth.onAuthStateChanged(u => { off(); r(u); }); }) };
    });
  const gisReady = load('https://accounts.google.com/gsi/client').catch(() => null);

  const userOf = u => u && { uid:u.uid, email:u.email, displayName:u.displayName, photoUrl:u.photoURL };
  const err = (code, message) => Object.assign(new Error(message || code), { code });

  const FirebaseAuthentication = {
    async signInWithGoogle(){
      const { auth } = await ready;
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt:'select_account' });
      try {
        const r = await auth.signInWithPopup(provider);
        return { user:userOf(r.user) };
      } catch(e){
        if(/popup-closed|cancelled-popup/.test(e.code || '')) throw err('canceled', 'cancel');
        if(/unauthorized-domain/.test(e.code || '')) throw err(e.code, 'このサイトのドメインがFirebaseの承認済みドメインに入っていません');
        if(/popup-blocked/.test(e.code || '')) throw err(e.code, 'ポップアップがブロックされました。ブラウザでこのサイトのポップアップを許可してください');
        throw e;
      }
    },
    async getCurrentUser(){ const { first, auth } = await ready; await first; return { user:userOf(auth.currentUser) }; },
    async signOut(){ const { auth } = await ready; await auth.signOut(); try { localStorage.removeItem(TOKEN_KEY); } catch(_){ /* 保存できない環境 */ } },
    async deleteUser(){
      const { auth } = await ready;
      try { await auth.currentUser.delete(); }
      catch(e){ if(e.code === 'auth/requires-recent-login') throw err('requires-recent-login', 'requires-recent-login'); throw e; }
    },
  };

  const FirebaseFirestore = {
    async setDocument({ reference, data }){ const { db } = await ready; await db.doc(reference).set(data); },
    async getDocument({ reference }){
      const { db } = await ready;
      const s = await db.doc(reference).get({ source:'server' });
      return { snapshot:{ id:s.id, path:reference, data:s.exists ? s.data() : null, metadata:{ fromCache:s.metadata.fromCache, hasPendingWrites:s.metadata.hasPendingWrites } } };
    },
    async deleteDocument({ reference }){ const { db } = await ready; await db.doc(reference).delete(); },
  };

  // Googleカレンダー: 許可(アクセストークン)はこのブラウザに有効期限つきで覚えておく。
  // 期限が切れたら、ボタンを押したときだけ許可画面を出す(勝手にポップアップは開かない)
  const saved = () => { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); } catch(_){ return null; } };
  const GoogleCalendarAuth = {
    async authorize({ scopes, interactive, email }){
      const t = saved();
      const has = t && t.exp > Date.now() + 60000 && scopes.every(s => (t.scopes || []).includes(s));
      if(has) return { accessToken:t.token };
      if(!interactive) throw err('NEEDS_CONSENT');
      await gisReady;
      if(!(window.google && google.accounts && google.accounts.oauth2)) throw err('network', 'Googleの許可画面を読み込めませんでした');
      return new Promise((ok, ng) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id:WEB_CLIENT_ID, scope:scopes.join(' '), hint:email, prompt:'',
          callback:r => {
            if(r.error){ ng(err(r.error === 'access_denied' ? 'CANCELED' : r.error, r.error_description || r.error)); return; }
            const granted = (r.scope || '').split(' ');
            try { localStorage.setItem(TOKEN_KEY, JSON.stringify({ token:r.access_token, exp:Date.now() + (Number(r.expires_in) || 3600) * 1000, scopes:granted })); } catch(_){ /* 保存できない環境 */ }
            ok({ accessToken:r.access_token });
          },
          error_callback:e => ng(err(e && e.type === 'popup_closed' ? 'CANCELED' : 'popup', (e && e.message) || 'popup')),
        });
        client.requestAccessToken();
      });
    },
    async revoke(){
      const t = saved();
      try { localStorage.removeItem(TOKEN_KEY); } catch(_){ /* 保存できない環境 */ }
      if(t && window.google && google.accounts) google.accounts.oauth2.revoke(t.token, () => {});
    },
  };

  window.Capacitor = { isNativePlatform:() => false, getPlatform:() => 'web', Plugins:{ FirebaseAuthentication, FirebaseFirestore, GoogleCalendarAuth } };
})();
