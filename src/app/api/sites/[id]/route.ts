import { NextRequest, NextResponse } from 'next/server'
import { getSiteById, updateSite, deleteSite, isDuplicateUrl } from '../../../lib/sheets/client'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await getSiteById(params.id)
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ site: found.site })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    // URL変更時の重複チェック
    if (body.url) {
      if (await isDuplicateUrl(body.url, params.id)) {
        return NextResponse.json({ error: 'このURLはすでに登録されています' }, { status: 409 })
      }
    }

    const ok = await updateSite(params.id, body)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = await deleteSite(params.id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
