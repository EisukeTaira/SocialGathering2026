## Plan: 新入生歓迎会 — 6コート運営Web

TL;DR: React（Vite）フロントを作成し、バックエンドは Google Apps Script で Google Sheets へ永続化します。フロントは GitHub Pages へデプロイし、認証は共有パスワードの簡易方式を採用します。Apps Script はホスティング不要で API を提供しますが、WebSocket 等の常時接続は使えないため短周期ポーリングで近似リアルタイム同期を実装します。

**Steps（概要）**
1. プロジェクト構成決定: フロント分離（`frontend/`）＋Apps Script（バックエンド）。
2. リポジトリ初期化: `package.json`、`frontend/` を作成して Vite+React でスキャフォールド。
3. フロント実装: ホーム `/`（6コート一覧）、`/court/:id`（コート詳細）、スコア入力コンポーネント、モバイル最適化。
4. バックエンド（Apps Script）実装: REST エンドポイント（コート一覧取得、スコア送信）と共有パスワード検証、Google Sheets 書き込み。
5. デプロイ: フロント→GitHub Pages、Apps Script→Google 側でデプロイ。
6. 検証: マルチクライアント同期（ポーリング）、スコア永続化、モバイル操作性の確認。

**API（高レベル）**
- `GET /api/courts` — コートの一覧と現在の対戦状態を返す。
- `GET /api/courts/:id` — 指定コートの詳細とスコア履歴を返す。
- `POST /api/courts/:id/score` — スコア更新。ボディにスコア情報と共有パスワードを含める。Apps Script 側でパスワード検証の上、Google Sheets に記録。

注意: Apps Script は WebSocket をサポートしないため、フロントは短周期のポーリング（例: 2〜5秒）で最新状態を取得する設計とします。

**Relevant files to create**
- `frontend/` — Vite + React ソース
- `docs/tasks.md` — 実装タスク一覧（このリポジトリ内）
- Apps Script プロジェクト（Google 側で作成）
- `README.md` — 実行手順と運用マニュアル

**認証と権限**
- 共有パスワード方式で確定。フロントはパスワードを送信し、Apps Script が検証して書き込みを許可します。簡易方式のため、運用時はパスワードの共有管理に注意してください。

**検証項目**
1. 2端末以上で同時にスコアを操作し、ポーリングで状態が反映されること。
2. Google Sheets に正しく記録されること（時刻、コートID、スコア、更新者ID等）。
3. モバイルでの入力が片手で可能な UX になっていること。

**次のアクション**
1. `frontend` の Vite+React スキャフォールドを作成します。
2. Apps Script の API エンドポイント（Sheets 連携・パスワード検証）を作成します。
3. フロントと Apps Script の接続を行い、動作確認を行います。

(このファイルは現在の決定事項（Apps Script と共有パスワード採用）を反映しています)
## Plan: 新入生歓迎会 — 6コート運営Web

TL;DR: React（Vite）フロント＋リアルタイムは Socket.IO（Express またはサーバレス）で実装し、スコア永続化は Google Sheets を優先案とする。フロントは GitHub Pages にデプロイ、API/リアルタイムは別ホスティング（Vercel/Heroku）か Google Apps Script を利用する構成を提案。

**Steps**
1. プロジェクト構成の決定（*depends on user*）: フロント分離（GitHub Pages）＋バックエンド別ホスト、または Next.js 単体。あなたの選択は「React + Vite」で、ホスティングは「GitHub Pages」を選択済みのため、フロント／バック分離案を想定。
2. リポジトリ初期化: `package.json` をルートに作成し、`frontend/` と `server/` フォルダを作る。フロントは Vite+React、サーバーは Express + Socket.IO（または Apps Script）。
3. フロント実装（並行可）: ホーム `/`（6コート一覧）、`/court/:id`（コート詳細）、スコア入力コンポーネント、モバイル最適化。UI はモバイルファースト設計。
4. バックエンド実装（Socket.IO）: REST API と WebSocket エンドポイント、簡易認証ミドルウェア（共有パスワード）、Google Sheets 書き込みモジュール。
5. Google Sheets 連携: OAuth/サービスアカウント or Google Apps Script を検討。Apps Script を使えばホスティング不要で API を作れるため、GitHub Pages フロント + Apps Script バックエンドの組合せが簡便。
6. デプロイ: フロント→GitHub Pages、バックエンド→Vercel/Heroku or Apps Script。Socket.IO が必要なら専用サーバーが必要。
7. 検証・テスト: マルチクライアントでリアルタイム同期、スコア保存確認、モバイルUI確認。

**Relevant files to create**
- README.md — プロジェクト説明と実行手順追記
- frontend/ (Vite+React のソース)
- server/ (Express + Socket.IO または Apps Script エンドポイント)
- docs/（操作手順・運用メモ）

**Verification**
1. 開発環境: `npm run dev`（フロント） と `npm run server`（バック）で起動し、ブラウザ2つで同時操作して同期を確認。
2. 永続化: Google Sheets にスコア行が追加されることを確認。
3. モバイル: 実機でスコア入力が片手で可能かを確認。
4. セキュリティ: 共有パスワードでスコア登録を保護できることを確認。

**Decisions / Assumptions**
- 採用技術: ユーザ選択により `React + Vite` を前提。リアルタイムは `Socket.IO` を想定。スコア保存は `Google Sheets` を希望。ホスティングはフロントを `GitHub Pages` と選択済みだが、WebSocket を用いる場合はバックエンドを別ホストする必要あり。
