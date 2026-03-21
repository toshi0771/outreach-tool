'use client'
import { useState } from 'react'
import { Search, Plus, CheckSquare, Square, Loader2, ExternalLink } from 'lucide-react'

const CATEGORIES = ['Web制作', 'システム開発', 'デザイン', 'マーケティング', 'コンサルティング',
  '飲食店', '小売', '美容・サロン', '医療・歯科', '教育・塾', '不動産', '建設・工務店',
  '製造業', '物流', 'その他']

const REGIONS = ['全国', '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川', '新潟', '富山', '石川', '福井',
  '山梨', '長野', '岐阜', '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫', '奈良',
  '和歌山', '鳥取', '島根', '岡山', '広島', '山口', '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄']

interface SearchResult {
  title: string
  url: string
  snippet: string
}

export default function CollectPage() {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasNext, setHasNext] = useState(false)
  const [start, setStart] = useState(1)

  const buildQuery = (startIndex = 1) => {
    const parts = [keyword]
    if (region && region !== '全国') parts.push(region)
    if (category) parts.push(category)
    return { q: parts.join(' '), start: startIndex }
  }

  const handleSearch = async (startIndex = 1) => {
    if (!keyword.trim()) { setError('キーワードを入力してください'); return }
    setLoading(true)
    setError('')
    setSuccess('')
    if (startIndex === 1) { setResults([]); setSelected(new Set()) }

    try {
      const { q, start: s } = buildQuery(startIndex)
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&start=${s}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (startIndex === 1) {
        setResults(data.items)
      } else {
        setResults(prev => [...prev, ...data.items])
      }
      setHasNext(data.hasNext)
      setStart(startIndex + 10)
    } catch {
      setError('検索に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (url: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(url) ? next.delete(url) : next.add(url)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results.map(r => r.url)))
    }
  }

  const handleRegister = async () => {
    if (selected.size === 0) { setError('登録するサイトを選択してください'); return }
    setSaving(true)
    setError('')
    setSuccess('')

    const targets = results.filter(r => selected.has(r.url))
    let successCount = 0
    let skipCount = 0

    for (const item of targets) {
      try {
        const res = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            title: item.title,
            form_url: '',
            category: category || 'その他',
            region: region || '全国',
            memo: item.snippet,
          }),
        })
        if (res.ok) {
          successCount++
        } else {
          skipCount++
        }
      } catch {
        skipCount++
      }
    }

    setSaving(false)
    setSuccess(`${successCount}件を登録しました${skipCount > 0 ? `（${skipCount}件スキップ）` : ''}`)
    setSelected(new Set())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">サイト収集</h1>
        {selected.size > 0 && (
          <button
            onClick={handleRegister}
            disabled={saving}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? '登録中...' : `選択した${selected.size}件を登録`}
          </button>
        )}
      </div>

      {/* 検索フォーム */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              className="input pl-9"
              placeholder="キーワード（例：ウェブ制作会社、工務店 ブログ）"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
            />
          </div>
          <select className="select w-40" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">カテゴリ（任意）</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select w-36" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">地域（任意）</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="btn-primary flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            検索
          </button>
        </div>
        <p className="text-xs text-gray-400">
          ※ キーワード・地域・カテゴリを組み合わせて検索します。例：「工務店」+「大阪」
        </p>
      </div>

      {/* エラー・成功メッセージ */}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{success}</div>}

      {/* 検索結果 */}
      {results.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggleAll} className="text-gray-500 hover:text-blue-600">
                {selected.size === results.length
                  ? <CheckSquare size={18} />
                  : <Square size={18} />}
              </button>
              <span className="text-sm text-gray-600">
                {results.length}件 / {selected.size}件選択中
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {results.map(item => (
              <div
                key={item.url}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected.has(item.url) ? 'bg-blue-50' : ''}`}
                onClick={() => toggleSelect(item.url)}
              >
                <div className="mt-0.5 text-gray-400 hover:text-blue-600 flex-shrink-0">
                  {selected.has(item.url)
                    ? <CheckSquare size={18} className="text-blue-600" />
                    : <Square size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="text-xs text-blue-600 truncate">{item.url}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.snippet}</div>
                </div>
              </div>
            ))}
          </div>

          {hasNext && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => handleSearch(start)}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                {loading ? '読み込み中...' : 'さらに読み込む'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
