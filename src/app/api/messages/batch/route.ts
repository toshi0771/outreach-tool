import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getSiteById, getTemplateById, createMessage, updateSite } from '../../../lib/sheets/client'
import { renderTemplate } from '../../../lib/sheets/template-renderer'
import type { Message, BatchPreviewItem } from '../../../types'

// POST /api/messages/batch-preview
export async function POST(req: NextRequest) {
  try {
    const { site_ids, template_id, variables_map, action } = await req.json()

    const templateFound = await getTemplateById(template_id)
    if (!templateFound) return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 })
    const { template } = templateFound

    // === プレビュー生成 ===
    if (action === 'preview') {
      const previews: BatchPreviewItem[] = []
      for (const site_id of site_ids) {
        const siteFound = await getSiteById(site_id)
        if (!siteFound) continue
        const vars = variables_map?.[site_id] ?? {}
        previews.push({
          site: siteFound.site,
          rendered_subject: renderTemplate(template.subject, vars),
          rendered_body: renderTemplate(template.body, vars),
        })
      }
      return NextResponse.json({ previews })
    }

    // === 一括承認 ===
    if (action === 'approve') {
      const { approved_by, sender_info } = req.body ? await req.json().catch(() => ({})) : {}
      const created: Message[] = []
      for (const site_id of site_ids) {
        const siteFound = await getSiteById(site_id)
        if (!siteFound) continue
        const vars = variables_map?.[site_id] ?? {}

        const msg: Message = {
          id: nanoid(),
          site_id,
          template_id,
          rendered_subject: renderTemplate(template.subject, vars),
          rendered_body: renderTemplate(template.body, vars),
          approved: true,
          approved_by: approved_by ?? 'unknown',
          sent_at: '',
          result: 'pending',
          error_detail: '',
          created_at: new Date().toISOString(),
        }
        await createMessage(msg)
        await updateSite(site_id, { status: 'queued' })
        created.push(msg)
      }
      return NextResponse.json({ created: created.length })
    }

    return NextResponse.json({ error: 'actionは preview または approve を指定してください' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
