'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckSquare, Square, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Site, Template, BatchPreviewItem } from '@/types'

export default function BatchPage() {
  const { data: session } = useSession()
  const [sites, setSites] = useState<Site[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [templateId, setTemplateId] = useState('')
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select')
  const [previews, setPreviews] = useState<BatchPreviewItem[]>([])
  const [variablesMap, setVariablesMap] = useState<Record<string, Record<string, string>>>({})
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [approvedCount, setApprovedCount] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/sites?status=pending').then(r => r.json()),
      fetch('/api/templates').then(r => r.json()),
    ]).then(([sData, tData]) => {
      setSites(sData.sites ?? [])
      setTemplates(tData.templates ?? [])
      setLoading(false)
    })
  }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => prev.size === sites.length ? new Set() : new Set(sites.map(s => s.id)))
  }

  // テンプレートの変数一覧
  const currentTemplate = templates.find(t => t.id === templateId)
  const templateVars = currentTemplate?.variables ?? []

  // 変数マップの更新
  const updateVar = (siteId: string, varName: string, value: string) => {
    setVariablesMap(prev => ({
      ...prev,
      [siteId]: { ...(prev[siteId] ?? {}), [varName]: value }
    }))
  }

  // プレビュー生成
  const handlePreview = async () => {
    if (!templateId || selected.size === 0) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/messages/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          site_ids: [...selected],
          template_id: templateId,
          variables_map: variablesMap,
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPreviews(data.previews)
      setStep('preview')
    } finally {
      setSubmitting(false)
    }
  }

  // 一括承認
  const handleApprove = async () => {
    if (!confirm(`${previews.length}件を一括承認して送信キューに追加しますか？\n\n承認後はキュー画面から送信を実行してください。`)) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/messages/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          site_ids: [...selected],
          template_id: templateId,
          variables_map: variablesMap,
          approved_by: session?.user?.email ?? 'unknown',
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setApprovedCount(data.created)
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>

  // ==== 完了画面 ====
  if (step === 'done') return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">バッチ承認</h1>
      <div className="card text-center py-12">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{approvedCount}件を承認しました</h2>
        <p className="text-gray-500 mb-6">送信キューに追加されました。<br/>キュー画面から送信を実行してください。</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => { setStep('select'); setSelected(new Set()); setTemplateId('') }} className="btn-secondary">
            続けて承認する
          </button>
          <a href="/queue" className="btn-primary">送信キューへ →</a>
        </div>
      </div>
    </div>
  )

  // ==== プレビュー画面 ====
  if (step === 'preview') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">バッチ承認 — プレビュー確認</h1>
        <div className="flex gap-3">
          <button onClick={() => setStep('select')} className="btn-secondary">← 戻る</button>
          <button onClick={handleApprove} disabled={submitting} className="btn-primary">
            {submitting ? '承認中...' : `${previews.length}件を一括承認`}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>確認してください：</strong> 承認すると送信キューに追加されます。各サイトの文面を確認した上で承認ボタンを押してください。
      </div>

      <div className="space-y-3">
        {previews.map(item => (
          <div key={item.site.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedPreview(expandedPreview === item.site.id ? null : item.site.id)}
            >
              <div>
                <p className="font-medium text-gray-900">{item.site.title || item.site.url}</p>
                <p className="text-xs text-gray-400">{item.site.url}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.site.status} />
                {expandedPreview === item.site.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedPreview === item.site.id && (
              <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                {item.rendered_subject && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">件名</p>
                    <p className="bg-gray-50 rounded p-2 text-sm">{item.rendered_subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">本文</p>
                  <div className="bg-gray-50 rounded p-2 text-sm whitespace-pre-wrap">{item.rendered_body}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // ==== サイト選択画面 ====
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">バッチ承認</h1>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {/* テンプレート選択 */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-3">① 使用テンプレートを選択</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-gray-400">テンプレートがありません。<a href="/templates" className="text-blue-600 underline">テンプレートを作成</a>してください。</p>
        ) : (
          <select className="select max-w-sm" value={templateId} onChange={e => setTemplateId(e.target.value)}>
            <option value="">テンプレートを選択...</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {/* サイト選択 */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">② 送信対象サイトを選択</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{selected.size}/{sites.length} 件選択中</span>
            <button onClick={toggleAll} className="text-sm text-blue-600 hover:underline">
              {selected.size === sites.length ? '全解除' : '全選択'}
            </button>
          </div>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            承認可能なサイト（未処理）がありません
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {sites.map(site => (
              <div key={site.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selected.has(site.id) ? 'bg-blue-50' : ''}`}
                onClick={() => toggleSelect(site.id)}
              >
                <div className="shrink-0 text-blue-600">
                  {selected.has(site.id) ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{site.title || site.url}</p>
                  <p className="text-xs text-gray-400 truncate">{site.url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500">{site.category}</span>
                  <span className="text-xs text-gray-400">{site.region}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 変数入力（テンプレートに変数がある場合） */}
      {templateVars.length > 0 && selected.size > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">③ 変数を入力（各サイトごと）</h2>
          <p className="text-sm text-gray-500 mb-4">空欄のままにすると {'{'} 変数名 {'}'} のまま送信されます。</p>
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {sites.filter(s => selected.has(s.id)).map(site => (
              <div key={site.id} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-800 mb-2">{site.title || site.url}</p>
                <div className="grid grid-cols-2 gap-2">
                  {templateVars.map(v => (
                    <div key={v}>
                      <label className="text-xs text-gray-500 block mb-0.5">{`{${v}}`}</label>
                      <input
                        className="input text-sm py-1.5"
                        placeholder={site.title && v === '会社名' ? site.title : v}
                        value={variablesMap[site.id]?.[v] ?? ''}
                        onChange={e => updateVar(site.id, v, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handlePreview}
          disabled={!templateId || selected.size === 0 || submitting}
          className="btn-primary flex items-center gap-2"
        >
          <Eye size={16} />
          {submitting ? '生成中...' : `${selected.size}件のプレビューを確認`}
        </button>
      </div>
    </div>
  )
}
