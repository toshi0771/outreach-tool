# フォームアプローチツール

カテゴリ・地域で絞り込んだ親和性の高いサイトの問い合わせフォームに、
バッチ承認フローで効率的にアプローチするための自社専用ツールです。

## 機能

- **サイト管理** — カテゴリ・地域・ステータスで管理
- **テンプレート管理** — 変数置換対応の文面テンプレート
- **バッチ承認** — 複数サイトを選択→プレビュー→一括承認
- **送信キュー** — 承認済みをランダム間隔で順次送信
- **送信履歴** — 全送信ログをCSV出力
- **法令対応** — robots.txt確認・送信間隔制限・オプトアウト管理

---

## セットアップ手順

### 1. Google Sheets API の準備

1. [Google Cloud Console](https://console.cloud.google.com) を開く
2. プロジェクトを作成（または既存を選択）
3. **APIとサービス** → **ライブラリ** → `Google Sheets API` を有効化
4. **APIとサービス** → **認証情報** → **サービスアカウントを作成**
   - 名前: `outreach-tool` など任意
   - ロール: 「編集者」または「基本 > 編集者」
5. 作成したサービスアカウントをクリック → **キー** → **鍵を追加** → **JSON** でダウンロード
6. [Google スプレッドシート](https://sheets.google.com)で新しいシートを作成
7. シートの **共有** → ダウンロードしたJSONの `client_email` を追加（編集権限）

### 2. Google OAuth の準備（ログイン用）

1. GCPコンソール → **APIとサービス** → **認証情報** → **OAuth 2.0クライアントID** を作成
2. アプリケーションの種類: **ウェブアプリケーション**
3. 承認済みリダイレクトURI に追加:
   - `http://localhost:3000/api/auth/callback/google`（開発用）
   - `https://あなたのrender-url.onrender.com/api/auth/callback/google`（本番用）

### 3. ローカル開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/toshi0771/outreach-tool.git
cd outreach-tool

# 依存関係をインストール
npm install

# Playwright用Chromiumをインストール
npx playwright install chromium

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して各値を入力

# Redis をローカルで起動（Docker使用の場合）
docker run -d -p 6379:6379 redis:alpine

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 4. Render へのデプロイ

1. [Render](https://dashboard.render.com) にログイン
2. **New** → **Blueprint** → GitHubリポジトリを接続
3. `render.yaml` が自動検出されてサービスが作成される
4. 環境変数を Render ダッシュボードで設定:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: JSONファイルの内容をまるごとペースト
   - `GOOGLE_SHEET_ID`: スプレッドシートURLの `/d/` と `/edit` の間の文字列
   - `NEXTAUTH_URL`: `https://あなたのサービス名.onrender.com`
   - `ALLOWED_EMAILS`: ログインを許可するGmailアドレス（カンマ区切り）
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
5. **Manual Deploy** → Deploy

---

## 環境変数一覧

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | サービスアカウントJSONの内容 | ✓ |
| `GOOGLE_SHEET_ID` | スプレッドシートID | ✓ |
| `NEXTAUTH_SECRET` | 認証用シークレット（32文字以上） | ✓ |
| `NEXTAUTH_URL` | アプリのURL | ✓ |
| `ALLOWED_EMAILS` | 許可メールアドレス（カンマ区切り） | ✓ |
| `GOOGLE_CLIENT_ID` | OAuthクライアントID | ✓ |
| `GOOGLE_CLIENT_SECRET` | OAuthクライアントシークレット | ✓ |
| `REDIS_URL` | RedisのURL | ✓ |
| `DAILY_SEND_LIMIT` | 1日の送信上限（デフォルト: 50） | - |
| `SEND_INTERVAL_MIN` | 最小送信間隔・秒（デフォルト: 30） | - |
| `SEND_INTERVAL_MAX` | 最大送信間隔・秒（デフォルト: 180） | - |
| `SLACK_WEBHOOK_URL` | Slack通知URL（任意） | - |

---

## 使い方

### 基本フロー

```
1. サイト登録 → 2. テンプレート作成 → 3. バッチ承認 → 4. 送信キューで送信実行
```

1. **サイト管理** でアプローチ先のURLを登録（カテゴリ・地域・フォームURLも入力）
2. **テンプレート** で文面を作成（`{会社名}` などの変数が使えます）
3. **バッチ承認** でサイトを選択 → テンプレートを選択 → プレビュー確認 → 一括承認
4. **送信キュー** で送信者情報を入力 → 「送信開始」ボタン
5. **送信履歴** で結果を確認

---

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + Tailwind CSS
- **データ保存**: Google スプレッドシート
- **フォーム操作**: Playwright (Headless Chromium)
- **ジョブキュー**: Bull + Redis
- **認証**: NextAuth.js (Google OAuth)
- **インフラ**: Render

---

## 注意事項

- 自動大量送信は禁止。必ず人間の承認を経て送信してください
- 送信先が明示的に拒否している場合はオプトアウトリストに追加してください
- robots.txt は自動的に確認・尊重されます
- 特定電子メール法・GDPRなどの関連法規を遵守してご利用ください
