Google Apps Script: SocialGathering2026 API

概要
- このファイルは Google Apps Script (code.gs) のサンプルです。デプロイすると、Google Sheets にスコアを書き込む簡易 API が利用できます。

準備手順
1. Google スプレッドシートを作成し、URL からスプレッドシート ID を取得します。
2. Google Apps Script エディタを開き、新しいプロジェクトを作成して `code.gs` の内容を貼り付けます。
3. スクリプトの `プロパティ`（スクリプトのプロパティ）に以下を追加します：
   - `SHEET_ID` = 作成したスプレッドシートの ID
   - `SHARED_PASSWORD` = 共有パスワード（例: 運用で配る文字列）
4. デプロイ -> 新しいデプロイ -> 「ウェブアプリ」を選択
   - 実行するユーザー: 自分（Me）
   - アクセス: URL にアクセスできるユーザー（Anyone）に設定（組織や公開範囲は運用に合わせて調整）
5. デプロイ後、発行された URL をコピーして、`frontend/src/config.js` の `API_BASE` に設定します（例: `https://script.google.com/macros/s/XXXXX/exec`）。

使い方（API）
- GET  `${API_BASE}/api/courts` — 6コートの現在状態を取得します。
- GET  `${API_BASE}/api/courts/{id}` — 指定コートの現在状態を取得します。
- POST `${API_BASE}/api/courts/{id}/score` — スコアを追加します。Request body は JSON で以下を含めます：
  {
    "teamA":"A",
    "teamB":"B",
    "scoreA": 21,
    "scoreB": 18,
    "password": "共有パスワード",
    "updatedBy": "username"
  }

注意点
- Apps Script は WebSocket を提供しないため、フロントは短周期ポーリング（例: 2〜5秒）で最新データを取得する設計です。
- スクリプトプロパティにプレーンテキストでパスワードを保存するため運用時は慎重に管理してください。
