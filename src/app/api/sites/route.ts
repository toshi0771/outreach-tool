import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getSites, createSite, isDuplicateUrl } from '@/lib/sheets/client'
import type { Site, SiteFilter } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filter: SiteFilter = {
      category: searchParams.get('category') ?? undefined,
      region: searchParams.get('region') ?? undefined,
      status: (searchParams.get('status') as any) ?? undefined,
      search: searchParams.get('search') ?? undefined,
    }

    let sites = await getSites()

    if (filter.category) sites = sites.filter(s => s.category === filter.category)
    if (filter.region) sites = sites.filter(s => s.region === filter.region)
    if (filter.status) sites = sites.filter(s => s.status === filter.status)
    if (filter.search) {
      const q = filter.search.toLowerCase()
      sites = sites.filter(s =>
        s.url.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.memo.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ sites })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, form_url, title, category, region, memo } = body

    if (!url) return NextResponse.json({ error: 'URLは必須です' }, { status: 400 })

    // 重複チェック
    if (await isDuplicateUrl(url)) {
      return NextResponse.json({ error: 'このURLはすでに登録されています' }, { status: 409 })
    }

    const site: Site = {
      id: nanoid(),
      url,
      form_url: form_url ?? '',
      title: title ?? '',
      category: category ?? '',
      region: region ?? '',
      status: 'pending',
      last_contact_date: '',
      memo: memo ?? '',
      created_at: new Date().toISOString(),
    }

    await createSite(site)
    return NextResponse.json({ site }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
