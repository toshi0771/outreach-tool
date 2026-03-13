import type { SiteStatus, MessageResult } from '@/types'

const siteStatusMap: Record<SiteStatus, { label: string; color: string }> = {
  pending:   { label: '未処理',     color: 'bg-gray-100 text-gray-700' },
  approved:  { label: '承認済み',   color: 'bg-blue-100 text-blue-700' },
  queued:    { label: 'キュー中',   color: 'bg-yellow-100 text-yellow-700' },
  sent:      { label: '送信済み',   color: 'bg-green-100 text-green-700' },
  replied:   { label: '返信あり',   color: 'bg-purple-100 text-purple-700' },
  opted_out: { label: '送信拒否',   color: 'bg-red-100 text-red-700' },
  error:     { label: 'エラー',     color: 'bg-red-100 text-red-600' },
}

const resultMap: Record<MessageResult, { label: string; color: string }> = {
  pending: { label: '待機中',   color: 'bg-gray-100 text-gray-700' },
  success: { label: '成功',     color: 'bg-green-100 text-green-700' },
  error:   { label: 'エラー',   color: 'bg-red-100 text-red-600' },
  skipped: { label: 'スキップ', color: 'bg-orange-100 text-orange-700' },
}

export function StatusBadge({ status }: { status: SiteStatus }) {
  const cfg = siteStatusMap[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' }
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>
}

export function ResultBadge({ result }: { result: MessageResult }) {
  const cfg = resultMap[result] ?? { label: result, color: 'bg-gray-100 text-gray-700' }
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>
}
