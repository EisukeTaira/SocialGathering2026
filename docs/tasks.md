# 実装タスク一覧

以下は実装フェーズで取り組むタスク一覧です。各タスクは優先度順に並べています。

1. リポジトリ初期化と `package.json` 作成 — (状態: not-started)
   - 目的: フロント開発用の npm スクリプトと依存を定義。

2. `frontend` スキャフォールド (Vite + React) — (状態: not-started)
   - 目的: 開発サーバ起動、ビルド、デプロイ設定の準備。

3. ホームページ `/`（6コート一覧）実装 — (状態: not-started)
   - 目的: 6コートのカード表示、各カードから詳細ページへ遷移。

4. 各コート詳細ページ `/court/:id` 実装 — (状態: not-started)
   - 目的: 対戦の詳細、現在のスコア、履歴を表示。

5. スコア入力コンポーネント実装 — (状態: not-started)
   - 目的: セットごとのスコア入力・確定・取り消し（undo）を提供。

6. モバイル最適化（レスポンシブ・片手操作） — (状態: not-started)
   - 目的: スマホで片手入力が簡単にできる UI を実現。

7. Google Apps Script バックエンド作成 — (状態: not-started)
   - 目的: `GET /api/courts`, `GET /api/courts/:id`, `POST /api/courts/:id/score` を実装。

8. API と Google Sheets 連携実装 — (状態: not-started)
   - 目的: スコアを Sheets に書き込み、読み込みロジックを提供。

9. 共有パスワード検証の実装（Apps Script） — (状態: not-started)
   - 目的: スコア送信時に簡易認証を行い、不正な書き込みを防止。

10. 近似リアルタイム同期の実装（短周期ポーリング） — (状態: not-started)
    - 目的: Apps Script の制約を踏まえ、フロント側で 2〜5 秒ポーリングして最新状態を反映。

11. フロントの GitHub Pages デプロイ設定 — (状態: not-started)
    - 目的: ビルドとデプロイの自動化（GitHub Actions などを想定）。

12. Apps Script のデプロイと Sheets 連携確認 — (状態: not-started)
    - 目的: 正常に Sheets へ書き込みが行えることを確認。

13. マルチクライアント検証・モバイル検証 — (状態: not-started)
    - 目的: 同時アクセスでの動作、UX の確認。

14. README と運用ドキュメント作成 — (状態: not-started)
    - 目的: デプロイ手順、運用時の注意点、共有パスワードの管理方法を記載。

---

次のステップ: 優先度トップの `frontend` スキャフォールド作成から開始します。進めてよければ指示をください。 
