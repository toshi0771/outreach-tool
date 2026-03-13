'use client'
import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Eye, Tag } from 'lucide-react'
import type { Template } from '@/types'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const openNew = () => {
    setEditTemplate(null)
    setForm({ name: '', subject: '', body: '' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setEditTemplate(t)
    setForm({ name: t.name, subject: t.subject, body: t.body })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editTemplate ? `/api/templates/${editTemplate.id}` : '/api/templates'
      const method = editTemplate ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, subject: form.subject, body: form.body })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowForm(false)
      fetchTemplates()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    fetchTemplates()
  }

  // テンプレートから変数を抽出（プレビュー表示用）
  const extractVars = (text: string) => [...new Set([...text.matchAll(/\{([^}]+)\}/g)].map(m => m[1]))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">テンプレート管理</h1>
        <button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={14} /> 新規テンプレート
        </button>
      </div>

      {/* テンプレート一覧 */}
      <div className="grid gap-4">
        {loading ? (
          <div className="card text-center text-gray-400 py-12">読み込み中...</div>
        ) : templates.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            <p className="mb-3">テンプレートがまだありません</p>
            <button onClick={openNew} className="btn-primary text-sm">最初のテンプレートを作成</button>
          </div>
        ) : templates.map(t => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                {t.subject && <p className="text-sm text-gray-500 mt-0.5">件名: {t.subject}</p>}
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 whitespace-pre-wrap">{t.body}</p>

                {/* 変数タグ */}
                {t.variables.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Tag size={12} className="text-gray-400" />
                    {t.variables.map(v => (
                      <span key={v} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{`{${v}}`}</span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  作成日: {new Date(t.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setPreviewTemplate(t)} className="btn-secondary text-xs flex items-center gap-1">
                  <Eye size={12} /> プレビュー
                </button>
                <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 作成/編集モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">{editTemplate ? 'テンプレート編集' : '新規テンプレート'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">テンプレート名 <span className="text-red-500">*</span></label>
                <input className="input" placeholder="例: Web制作会社向け提案文" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">件名</label>
                <input className="input" placeholder="例: {会社名}様へのご提案" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  本文 <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-2 text-xs">{'{'} 変数名 {'}'} でプレースホルダーを使用できます</span>
                </label>
                <textarea
                  className="input resize-none h-52 font-mono text-sm"
                  placeholder={"例:\n{会社名}の{担当者名}様\n\nはじめまして。〇〇と申します。\n..."}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                />
              </div>

              {/* リアルタイム変数プレビュー */}
              {(form.subject || form.body) && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 mb-2">検出された変数:</p>
                  <div className="flex flex-wrap gap-2">
                    {extractVars(`${form.subject} ${form.body}`).length === 0
                      ? <span className="text-xs text-gray-400">変数なし</span>
                      : extractVars(`${form.subject} ${form.body}`).map(v => (
                          <span key={v} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{`{${v}}`}</span>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)} className="btn-secondary">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.body} className="btn-primary">
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プレビューモーダル */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">プレビュー: {previewTemplate.name}</h2>
            </div>
            <div className="p-6 space-y-4">
              {previewTemplate.subject && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">件名</p>
                  <p className="bg-gray-50 rounded p-3 text-sm">{previewTemplate.subject}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">本文</p>
                <div className="bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap">{previewTemplate.body}</div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setPreviewTemplate(null)} className="btn-secondary">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
