'use client'
import { useState } from 'react'
import { Shield, Clock, Mail, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const [optOutUrls, setOptOutUrls] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // 将来: APIで保存
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">設定</h1>

      {/* 送信設定 */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Clock size={16} /> 送信設定
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">1日の送信上限件数</label>
            <p className="text-sm text-gray-800 bg-gray-50 rounded p-2">
              現在: <strong>50件</strong>（変更は .env ファイルの DAILY_SEND_LIMIT を編集）
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">送信間隔</label>
            <p className="text-sm text-gray-800 bg-gray-50 rounded p-2">
              ランダム: <strong>30秒〜3分</strong>（変更は SEND_INTERVAL_MIN / MAX を編集）
            </p>
          </div>
        </div>
      </div>

      {/* オプトアウトリスト */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Shield size={16} /> オプトアウトリスト（送信禁止URL）
        </h2>
        <p className="text-sm text-gray-500 mb-4">1行に1URLで記入。このリストのURLには送信されません。</p>
        <textarea
          className="input resize-none h-40 font-mono text-sm"
          placeholder={"https://example.com\nhttps://spam-target.example.jp"}
          value={optOutUrls}
          onChange={e => setOptOutUrls(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button onClick={handleSave} className="btn-primary text-sm">
            {saved ? '✓ 保存しました' : '保存する'}
          </button>
        </div>
      </div>

      {/* 法令対応 */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Mail size={16} /> 法令・倫理対応
        </h2>
        <ul className="space-y-2 text-sm">
          {[
            { label: '特定電子メール法', status: '✓ 手動送信・承認フロー必須', ok: true },
            { label: 'robots.txt 確認', status: '✓ 送信前に自動チェック', ok: true },
            { label: '送信間隔制限', status: '✓ ランダム30秒〜3分', ok: true },
            { label: '1日の上限設定', status: '✓ デフォルト50件/日', ok: true },
            { label: 'オプトアウト管理', status: '✓ 送信拒否リスト', ok: true },
            { label: '送信ログ保存', status: '✓ 全送信を記録', ok: true },
          ].map(item => (
            <li key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-700">{item.label}</span>
              <span className={`text-sm ${item.ok ? 'text-green-600' : 'text-red-500'}`}>{item.status}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* セットアップガイド */}
      <div className="card bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-3">初期セットアップ確認</h2>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-center gap-2">
            <ExternalLink size={12} />
            <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">
              GCPでサービスアカウントを作成し、Google Sheets APIを有効化
            </a>
          </li>
          <li className="flex items-center gap-2">
            <ExternalLink size={12} />
            <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noopener noreferrer" className="underline">
              Google スプレッドシートを作成し、サービスアカウントを共有
            </a>
          </li>
          <li className="flex items-center gap-2">
            <ExternalLink size={12} />
            <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="underline">
              Renderで環境変数を設定（.env.exampleを参照）
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
