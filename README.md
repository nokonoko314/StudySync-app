# StudySync

学習タスク・タイマー計測・忘却曲線に基づく自動復習・カレンダー・統計をひとつにまとめた学習管理アプリです。React + Vite + Capacitor（Android）で構築されています。

## 主な機能

- **タスク管理** — 教科・プロジェクト別のタスク管理、右スワイプで完了・左スワイプで削除、複数選択での一括操作
- **学習タイマー** — 秒単位で正確に計測、一時停止・再開に対応、24時間の計測上限
- **忘却曲線での自動復習** — タスク完了時に間隔（1日後・3日後…）を指定して復習タスクを自動生成
- **カレンダー** — 月表示・週表示、日別の学習時間をヒートマップ表示、プロジェクトごとのカレンダー
- **タイムライン** — 1日の学習の流れを時系列で可視化
- **統計** — 週間・教科別の学習時間の内訳
- **通知** — 期限のリマインダー（何時間前に通知するか設定可）、毎日のリマインダー
- **データのインポート/エクスポート** — JSONバックアップの読み込み
- **Googleアカウント連携** — Firebase Authenticationでのサインインと、Firestoreへの学習データの自動バックアップ・復元
- **壁紙・テーマカラーのカスタマイズ**

## 技術スタック

- React 19 / TypeScript / Vite
- Capacitor（Android）
- Firebase Authentication / Cloud Firestore（`@capacitor-firebase/*`）

## セットアップ

```bash
cd app
npm install
npm run dev
```

### Android（Capacitor）

```bash
cd app
npm run android:sync   # Webをビルドしてネイティブプロジェクトに同期
npm run android:open   # Android Studioで開く
```

Googleアカウント連携・クラウドバックアップ機能を使う場合は、各自のFirebaseプロジェクトを作成し、`app/android/app/google-services.json` を配置してください（このファイルはリポジトリには含まれていません）。

## ディレクトリ構成

```
app/
  src/
    components/   共有UIコンポーネント
    screens/      画面（ホーム・カレンダー・タイムライン・統計・設定）
    state/        アプリの状態管理（Context）
    lib/          ユーティリティ（日付・統計計算など）
    styles/       グローバルスタイル
  android/        Capacitorのネイティブ（Android）プロジェクト
```
