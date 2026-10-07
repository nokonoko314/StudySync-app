# StudySync

忘却曲線にあわせて復習を自動で予定に入れる、学習スケジュールのアプリです。勉強することを1日の時間軸に置き、完了すると 1日後・3日後・1週間後… と復習が自動で追加されます。Android アプリとして配布しています(現在のバージョンは `mockup.html` の `APP_VERSION`)。

## 主な機能

- **時間軸での計画** — タスクをドラッグで時間軸に置く、スワイプで完了・未設定に戻す・削除、未設定のタスクの自動配置
- **忘却曲線での自動復習** — 完了時の理解度(もう一度・ふつう・完璧)で次の復習日を決める。統計で教科ごとの記憶の定着を推定
- **すばやいタスク作成** — 「次の空き」やこれまでの予定から読んだ「いつも」の時間を候補に出す、タイトルから教科を推測
- **毎週くり返す予定** — 課題などを曜日・時刻で登録し、4週間先まで自動で作成
- **カレンダー** — 日曜はじまりの月表示、土日・祝日(アプリ内で計算)の色分け、プロジェクトの期間表示
- **Googleアカウント連携** — Firebase Authentication でログインし、Cloud Firestore に自動保存(ほかの端末と同期)
- **Googleカレンダー同期** — 予定をホームとカレンダーに表示、時間軸のタスクを「StudySync」カレンダーへ書き出し
- **ホーム画面ウィジェット** — 今日の予定・次の予定・今日の進み具合・今週の勉強時間
- **通知** — 予定の開始前と毎日のリマインダー
- **統計** — 週間・教科別の勉強時間、記憶の定着、今後7日の復習
- **StudySync プレミアム** — RevenueCat によるアプリ内課金の準備(キーを設定すると有効)

## 構成

| 場所 | 内容 |
|---|---|
| `mockup.html` | アプリ本体(1ファイルのHTML)。ブラウザで開くと見本データ入りのデモとして動く |
| `preview-app/` | `mockup.html` を Capacitor で Android アプリにするプロジェクト |
| `preview-app/build-www.mjs` | `mockup.html` をアプリ用の `www/index.html` に変換する(アプリ版のフラグ・戻るボタン・ステータスバーなど) |
| `preview-app/android/` | Android のネイティブ部分(ウィジェット、Googleカレンダーの許可、起動画面、アイコン) |
| `preview-app/build-web.mjs` | `www/index.html` からブラウザ版 `pages/app/index.html` を作る(`web-shim.js` で Firebase の Web SDK を使う) |
| `pages/` | GitHub Pages のまとめサイトとブラウザ版(`gh-pages` ブランチへコピーして公開) |
| `site/` | Firebase Hosting で公開するページ(プライバシーポリシー、アカウント削除の案内) |
| `docs/` | 要件・設計の資料 |
| `app/` | 以前の React 版(現在は使っていない) |

## ビルド(Android)

```bash
cd preview-app
npm install
npm run sync        # mockup.html → www/index.html を作って Android プロジェクトへ同期
cd android
./gradlew assembleDebug    # APK は android/app/build/outputs/apk/debug/
./gradlew bundleRelease    # Play ストア用の AAB
```

### リポジトリに含めていないファイル

- `preview-app/android/app/google-services.json` — Firebase プロジェクトの設定
- `preview-app/android/studysync.jks` と `keystore.properties` — 署名鍵(なくすと更新を出せないので、必ず別の場所にバックアップする)

### Google Cloud の設定(Googleカレンダー同期)

1. Google Calendar API を有効にする
2. OAuth 同意画面のスコープに `calendar.readonly` と `calendar.app.created` を追加する
3. Android の OAuth クライアント(パッケージ名 `com.studysync.app` と署名鍵の SHA-1)を登録する

## プライバシーポリシーの公開

```bash
npx firebase-tools login
npx firebase-tools deploy --only hosting --project studysync-73a0f --config site/firebase.json
```

公開前に `site/public/` の `CONTACT_EMAIL` を連絡先のメールアドレスに置き換えてください。
