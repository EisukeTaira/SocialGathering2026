**デプロイ手順（概要）**

このドキュメントは、フロントエンドを GitHub Pages にデプロイし、Apps Script API の URL を自動的に組み込む手順を説明します。

1) リポジトリシークレット設定（GitHub）
- `APPS_SCRIPT_URL` に Apps Script の公開 URL を設定してください（例: `https://script.google.com/macros/s/XXXXX/exec`）。

2) ワークフロー自動デプロイ（GitHub Actions）
- `main` ブランチへ push すると自動でビルドされ `frontend/dist` が `gh-pages` ブランチへデプロイされます。
- ワークフローは `.github/workflows/gh-pages-deploy.yml` を使用します。

3) 手動ローカルビルド時の設定
- ローカルで API_URL を設定してビルドするには、`frontend` フォルダで次を実行します。

```bash
cd frontend
node scripts/set-api-base.js "https://script.google.com/macros/s/XXXXX/exec"
npm run build
```

これにより `frontend/src/config.js` が上書きされ、ビルドに含まれます。

4) ローカルで動作確認する（簡易）
- ビルド後、`frontend/dist` を簡易サーバで確認できます（例: `npx serve frontend/dist`）。

5) 注意点
- Apps Script の URL を GitHub シークレットに保存することで公開リポジトリでも URL を漏らさずにビルドできます。
- 共有パスワードは Apps Script のスクリプトプロパティで管理してください（プレーンテキスト保存のため運用に注意）。
