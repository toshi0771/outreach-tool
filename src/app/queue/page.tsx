'use client'
import { useEffect, useState } from 'react'
import { Send, AlertCircle, Clock, User } from 'lucide-react'
import type { Message } from '@/types'

export default function QueuePage() {
  const [queue, setQueue] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ queued: number; estimated_minutes: number } | null>(null)
  const [error, setError] = useState('')
  const [senderInfo, setSenderInfo] = useState({
    sender_name: '',
    sender_email: '',
    sender_company: '',
    sender_phone: '',
  })

  const fetchQueue = async () => {
    const res = await fetch('/api/messages/send')
    const data = await res.json()
    setQueue(data.queue ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchQueue() }, [])

  const handleSend = async () => {
    if (!senderInfo.sender_name || !senderInfo.sender_email || !senderInfo.sender_company) {
      setError('送信者情報（名前・メール・会社名）を入力してください')
      return
    }
    if (!confirm(`${queue.length}件の送信を開始します。\n\nランダムな間隔で順次送信されます。よろしいですか？`)) return

    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(senderInfo),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">送信キュー</h1>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {result ? (
        <div className="card bg-green-50 border-green-200">
          <div className="text-green-600 text-4xl mb-3">✓</div>
          <h2 className="text-lg font-bold text-green-800">{result.queued}件の送信を開始しました</h2>
          <p className="text-green-700 mt-1">推定完了時間: 約{result.estimated_minutes}分後</p>
          <p className="text-sm text-green-600 mt-3">バックグラウンドで順次送信中です。履歴画面で結果を確認できます。</p>
          <div className="mt-4 flex gap-3">
            <a href="/history" className="btn-primary text-sm">履歴を確認 →</a>
            <button onClick={() => { setResult(null); fetchQueue() }} className="btn-secondary text-sm">キューを再確認</button>
          </div>
        </div>
      ) : (
        <>
          {/* キュー件数 */}
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{queue.length}</p>
                <p className="text-gray-500">件の承認済みメッセージが送信待ち</p>
              </div>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <p className="mb-3">送信待ちのメッセージがありません</p>
              <a href="/batch" className="btn-primary text-sm">バッチ承認を行う →</a>
            </div>
          ) : (
            <>
              {/* 送信者情報 */}
              <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <User size={16} /> 送信者情報（フォームに入力される内容）
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">お名前 <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="山田 太郎" value={senderInfo.sender_name}
                      onChange={e => setSenderInfo(p => ({ ...p, sender_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">メールアドレス <span className="text-red-500">*</span></label>
                    <input className="input" type="email" placeholder="you@example.com" value={senderInfo.sender_email}
                      onChange={e => setSenderInfo(p => ({ ...p, sender_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">会社名 <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="株式会社○○" value={senderInfo.sender_company}
                      onChange={e => setSenderInfo(p => ({ ...p, sender_company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">電話番号（任意）</label>
                    <input className="input" placeholder="03-1234-5678" value={senderInfo.sender_phone}
                      onChange={e => setSenderInfo(p => ({ ...p, sender_phone: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-3">
                <Clock size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">送信の注意事項</p>
                  <ul className="space-y-1 list-disc list-inside text-amber-700">
                    <li>送信はランダムな間隔（30秒〜3分）で順次実行されます</li>
                    <li>送信中はページを閉じても処理はバックグラウンドで継続します</li>
                    <li>1日の送信上限に達した場合は残りが翌日以降に持ち越されます</li>
                    <li>robots.txtで禁止されているサイトは自動的にスキップされます</li>
                  </ul>
                </div>
              </div>

              {/* 送信開始ボタン */}
              <div className="flex justify-end">
                <button onClick={handleSend} disabled={sending} className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                  <Send size={18} />
                  {sending ? '送信キューに追加中...' : `${queue.length}件の送信を開始`}
                </button>
              </div>

              {/* キューリスト */}
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700">送信予定リスト</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {queue.map((msg, i) => (
                    <div key={msg.id} className="px-4 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 w-6 text-right">{i + 1}</span>
                        <div>
                          <p className="text-gray-700 line-clamp-1">{msg.rendered_subject || msg.rendered_body.substring(0, 40) + '...'}</p>
                          <p className="text-xs text-gray-400">承認者: {msg.approved_by}</p>
                        </div>
                      </div>
                      <span className="badge bg-blue-100 text-blue-700">承認済み</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
