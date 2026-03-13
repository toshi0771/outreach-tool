'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Globe, Send, MessageSquare, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import type { DashboardStats } from '@/types'
import Link from 'next/link'

const COLORS = ['#6B7280', '#2E75B6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
  if (!stats) return null

  const pieData = [
    { name: '未処理', value: stats.pending },
    { name: '承認済み', value: stats.approved },
    { name: 'キュー中', value: stats.queued },
    { name: '送信済み', value: stats.sent },
    { name: '返信あり', value: stats.replied },
    { name: 'エラー', value: stats.error },
  ].filter(d => d.value > 0)

  const kpiCards = [
    { label: '登録サイト総数', value: stats.total, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '送信済み', value: stats.sent, icon: Send, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '返信あり', value: stats.replied, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'エラー', value: stats.error, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  const limitPct = Math.min(100, Math.round((stats.today_sent / stats.daily_limit) * 100))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <span className="text-sm text-gray-500">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${bg} p-3 rounded-lg`}>
              <Icon className={`${color} w-5 h-5`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 本日の送信状況 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-700">本日の送信状況</h2>
          </div>
          <span className="text-sm text-gray-500">{stats.today_sent} / {stats.daily_limit} 件</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${limitPct >= 90 ? 'bg-red-500' : limitPct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${limitPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">1日の上限: {stats.daily_limit} 件</p>
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">ステータス別サイト数</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">ステータス概要</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pieData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="件数">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/sites" className="btn-secondary text-sm">+ サイト登録</Link>
          <Link href="/batch" className="btn-primary text-sm">バッチ承認を開始</Link>
          <Link href="/queue" className="btn-secondary text-sm">送信キューを確認</Link>
          <Link href="/history" className="btn-secondary text-sm">履歴を見る</Link>
        </div>
      </div>
    </div>
  )
}
