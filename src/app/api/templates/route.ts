import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getTemplates, createTemplate } from '@/lib/sheets/client'
import { extractVariables } from '@/lib/sheets/template-renderer'
import type { Template } from '@/types'

export async function GET() {
  try {
    const templates = await getTemplates()
    return NextResponse.json({ templates })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, subject, body: templateBody } = body

    if (!name || !templateBody) {
      return NextResponse.json({ error: 'テンプレート名と本文は必須です' }, { status: 400 })
    }

    const variables = extractVariables(`${subject ?? ''} ${templateBody}`)

    const template: Template = {
      id: nanoid(),
      name,
      subject: subject ?? '',
      body: templateBody,
      variables,
      created_at: new Date().toISOString(),
    }

    await createTemplate(template)
    return NextResponse.json({ template }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
