'use client'
import { useEffect, useState } from 'react'
import { Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { ResultBadge } from '@/components/ui/StatusBadge'
import type { Message } from '@/types'

export default function HistoryPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'' | 'success' | 'error' | 'skipped'>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    const res = await fetch('/api/messages/send')  // reuse for now
    // Actually fetch all messages
    const histRes = await fetch('/api/history')
    const data = await histRes.json()
    setMessages(data.messages ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [])

  const filtered = filter ? messages.filter(m => m.result === filter) : messages.filter(m => m.result !== 'pending')

  const stats = {
    success: messages.filter(m => m.result === 'success').length,
    error: messages.filter(m => m.result === 'error').length,
    skipped: messages.filter(m => m.result === 'skipped').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">送信履歴</h1>
        <div className="flex gap-2">
          <button onClick={fetchHistory} className="btn-secondary text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> 更新
          </button>
          <a href="/api/export?type=history" className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={14} /> CSV出力
          </a>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '送信成功', value: stats.success, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'エラー', value: stats.error, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'スキップ', value: stats.skipped, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card text-center py-4">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        {[
          { value: '', label: 'すべて' },
          { value: 'success', label: '成功' },
          { value: 'error', label: 'エラー' },
          { value: 'skipped', label: 'スキップ' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === opt.value ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 履歴テーブル */}
      <div className="card p-0 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-12 text-gray-400">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">履歴がありません</div>
          ) : filtered.map(msg => (
            <div key={msg.id}>
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ResultBadge result={msg.result} />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {msg.rendered_subject || msg.rendered_body.substring(0, 60) + '...'}
                    </p>
                    <p className="text-xs text-gray-400">
                      承認者: {msg.approved_by} | {msg.sent_at ? new Date(msg.sent_at).toLocaleString('ja-JP') : '未送信'}
                    </p>
                  </div>
                </div>
                {expandedId === msg.id ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </div>

              {expandedId === msg.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  {msg.rendered_subject && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mt-3 mb-1">件名</p>
                      <p className="text-sm bg-white rounded p-2 border border-gray-200">{msg.rendered_subject}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">本文</p>
                    <div className="text-sm bg-white rounded p-2 border border-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">{msg.rendered_body}</div>
                  </div>
                  {msg.error_detail && (
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1">エラー詳細</p>
                      <p className="text-sm bg-red-50 rounded p-2 text-red-700">{msg.error_detail}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    メッセージID: {msg.id} | サイトID: {msg.site_id}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
