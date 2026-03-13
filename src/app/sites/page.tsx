'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Download, Upload, Trash2, Edit2, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Site, SiteStatus } from '@/types'

const CATEGORIES = ['Web制作', 'システム開発', 'デザイン', 'マーケティング', 'コンサルティング',
  '飲食店', '小売', '美容・サロン', '医療・歯科', '教育・塾', '不動産', '建設・工務店',
  '製造業', '物流', 'その他']

const REGIONS = ['全国', '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川', '新潟', '富山', '石川', '福井',
  '山梨', '長野', '岐阜', '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫', '奈良',
  '和歌山', '鳥取', '島根', '岡山', '広島', '山口', '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄']

const STATUSES: { value: SiteStatus | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'pending', label: '未処理' },
  { value: 'approved', label: '承認済み' },
  { value: 'queued', label: 'キュー中' },
  { value: 'sent', label: '送信済み' },
  { value: 'replied', label: '返信あり' },
  { value: 'opted_out', label: '送信拒否' },
  { value: 'error', label: 'エラー' },
]

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState<SiteStatus | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [editSite, setEditSite] = useState<Site | null>(null)
  const [form, setForm] = useState({ url: '', form_url: '', title: '', category: '', region: '', memo: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchSites = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    if (region) params.set('region', region)
    if (status) params.set('status', status)
    const res = await fetch(`/api/sites?${params}`)
    const data = await res.json()
    setSites(data.sites ?? [])
    setLoading(false)
  }, [search, category, region, status])

  useEffect(() => { fetchSites() }, [fetchSites])

  const openNew = () => {
    setEditSite(null)
    setForm({ url: '', form_url: '', title: '', category: '', region: '', memo: '' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (site: Site) => {
    setEditSite(site)
    setForm({ url: site.url, form_url: site.form_url, title: site.title, category: site.category, region: site.region, memo: site.memo })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editSite ? `/api/sites/${editSite.id}` : '/api/sites'
      const method = editSite ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowForm(false)
      fetchSites()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このサイトを削除しますか？')) return
    await fetch(`/api/sites/${id}`, { method: 'DELETE' })
    fetchSites()
  }

  const handleStatusChange = async (id: string, newStatus: SiteStatus) => {
    await fetch(`/api/sites/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    fetchSites()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">サイト管理</h1>
        <div className="flex gap-2">
          <a href="/api/export?type=sites" className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={14} /> CSV出力
          </a>
          <button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={14} /> サイト登録
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input className="input pl-9" placeholder="URL・タイトルで検索" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-40" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">カテゴリ: 全て</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select w-36" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">地域: 全て</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select w-36" value={status} onChange={e => setStatus(e.target.value as SiteStatus | '')}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* テーブル */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">サイト</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">カテゴリ</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">地域</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">ステータス</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">最終接触</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">読み込み中...</td></tr>
            ) : sites.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">サイトが見つかりません</td></tr>
            ) : sites.map(site => (
              <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 truncate max-w-xs">{site.title || site.url}</div>
                  <div className="text-gray-400 text-xs truncate max-w-xs flex items-center gap-1">
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{site.url}</a>
                    <ExternalLink size={10} />
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{site.category || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{site.region || '-'}</td>
                <td className="px-4 py-3">
                  <select
                    className="text-xs border-0 bg-transparent cursor-pointer"
                    value={site.status}
                    onChange={e => handleStatusChange(site.id, e.target.value as SiteStatus)}
                  >
                    {STATUSES.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {site.last_contact_date ? new Date(site.last_contact_date).toLocaleDateString('ja-JP') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(site)} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(site.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          {sites.length} 件表示
        </div>
      </div>

      {/* 登録/編集モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editSite ? 'サイト編集' : 'サイト新規登録'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">サイトURL <span className="text-red-500">*</span></label>
                <input className="input" placeholder="https://example.com" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">フォームURL</label>
                <input className="input" placeholder="https://example.com/contact" value={form.form_url} onChange={e => setForm(f => ({ ...f, form_url: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">会社名・サイト名</label>
                <input className="input" placeholder="株式会社○○" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">カテゴリ</label>
                  <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">選択してください</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">地域</label>
                  <select className="select" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                    <option value="">選択してください</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">メモ</label>
                <textarea className="input resize-none h-20" placeholder="備考・メモ" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !form.url} className="btn-primary">
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
