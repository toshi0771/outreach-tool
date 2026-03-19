import { NextRequest, NextResponse } from 'next/server'
import { getSites, getMessages } from '@/lib/sheets/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'sites'

  try {
    if (type === 'sites') {
      const sites = await getSites()
      const header = 'ID,URL,フォームURL,タイトル,カテゴリ,地域,ステータス,最終接触日,メモ,登録日\n'
      const rows = sites.map(s =>
        [s.id, s.url, s.form_url, s.title, s.category, s.region, s.status, s.last_contact_date, s.memo, s.created_at]
          .map(v => `"${(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n')
      const csv = '\uFEFF' + header + rows  // BOM付きでExcel対応

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sites_${new Date().toISOString().split('T')[0]}.csv"`,
        }
      })
    }

    if (type === 'history') {
      const messages = await getMessages()
      const header = 'ID,サイトID,テンプレートID,件名,本文,承認,承認者,送信日時,結果,エラー詳細,作成日\n'
      const rows = messages.map(m =>
        [m.id, m.site_id, m.template_id, m.rendered_subject, m.rendered_body,
          m.approved ? '承認済' : '未承認', m.approved_by, m.sent_at, m.result, m.error_detail, m.created_at]
          .map(v => `"${(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n')
      const csv = '\uFEFF' + header + rows

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="history_${new Date().toISOString().split('T')[0]}.csv"`,
        }
      })
    }

    return NextResponse.json({ error: '不明なtype' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
