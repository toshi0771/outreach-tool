# アウトリーチツール 現在のステータス

## 環境情報

| 項目 | 値 |
|------|-----|
| 本番URL | https://outreach-tool-weo9.onrender.com |
| GCPプロジェクト | outreaach-serch |
| 検索エンジンID (GOOGLE_SEARCH_CX) | a58f5c155df8c45ba |
| APIキー | 3代目（Custom Search APIに制限済み） |
| GitHub | toshi0771/outreach-tool |
| デプロイ | Render（GitHubへpushで自動デプロイ） |

## Render 環境変数（設定済み）

| KEY | 状態 |
|-----|------|
| GOOGLE_SEARCH_API_KEY | ✅ 設定済み（3代目キー） |
| GOOGLE_SEARCH_CX | ✅ 設定済み（a58f5c155df8c45ba） |
| GOOGLE_SERVICE_ACCOUNT_JSON | ✅ 設定済み |
| GOOGLE_SHEET_ID | ✅ 設定済み |
| NEXTAUTH_SECRET | ✅ 設定済み |
| NEXTAUTH_URL | ✅ 設定済み |
| ALLOWED_EMAILS | ✅ 設定済み |
| GOOGLE_CLIENT_ID | ✅ 設定済み |
| GOOGLE_CLIENT_SECRET | ✅ 設定済み |
| REDIS_URL | ✅ 設定済み |

---

## バグ・課題

### 🔴 [BUG-001] サイト収集でカテゴリ・地域を指定するとエラーになる（未解決）

**症状**：サイト収集画面でカテゴリや地域を選択して検索するとエラーが返る

**原因（特定済み）**：
1. `start` パラメータが文字列のまま渡されていた（整数に変換が必要）
2. `start + num > 100` になるとAPIがエラーを返す制約を考慮していなかった
3. エラーの詳細がcatchブロックで握り潰されていた（デバッグ不能）
4. 日本語クエリなのに `lr=lang_ja` が未設定（英語コンテンツが混入）

**修正内容**（`src/app/api/search/route.ts`）：
- `start` を整数にパース、1〜91の範囲に制限
- URLを `URLSearchParams` で正しくエンコード（日本語対応）
- `lr=lang_ja` と `gl=jp` を追加
- エラー詳細をログ出力＋レスポンスに含めるよう変更

**ステータス**：✅ コード修正済み → push・デプロイ待ち

---

### ⚠️ [INFO-001] Custom Search JSON API 新規顧客向け終了

**内容**：Googleが2027年1月1日にCustom Search JSON APIを終了予定  
**現状**：既存ユーザーとして利用継続可能（2027年まで）  
**対応**：当面は現行APIを使用。将来的にVertex AI Searchへの移行を検討

---

## 作業ログ

### 2026-03-22
- GCPプロジェクト `outreaach-serch` を新規作成
- Custom Search API を有効化
- Programmable Search Engine `outreach-search2` を作成（ID: a58f5c155df8c45ba）
- GCP課金アカウントをプロジェクトに紐づけ（フルアカウント有効化）
- APIキー3代目を作成、Custom Search APIに制限をかける
- Renderの環境変数 `GOOGLE_SEARCH_API_KEY` / `GOOGLE_SEARCH_CX` を設定
- サイト収集画面（/collect）がデプロイされ表示確認済み

### 2026-03-23
- BUG-001の原因を特定
- `src/app/api/search/route.ts` を修正（start範囲制限・日本語パラメータ追加・エラー詳細出力）
- `CURRENT_STATUS.md` を作成（進捗管理開始）

---

## 次のアクション

1. `git add src/app/api/search/route.ts CURRENT_STATUS.md`
2. `git commit -m "fix: search route - start param validation, Japanese lang params, error detail"`
3. `git push origin main`
4. Renderのデプロイ完了を確認
5. サイト収集画面で「工務店」+「大阪」を検索して動作確認
6. エラーが出る場合、ブラウザのDevTools（F12 > Network）でエラー詳細を確認

---

## 新チャットへの引き継ぎ方法

このファイル（CURRENT_STATUS.md）を新しいチャットにアップロードすれば引き継ぎ可能。
追加で `outreach-tool-fixed.zip` もアップロードすると完全に引き継ぎができる。
