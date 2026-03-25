import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const startParam = searchParams.get('start') || '1'
  const page = Math.max(1, Math.ceil((parseInt(startParam, 10) || 1) / 10))

  if (!query) return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 })

  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Serper APIの設定がありません' }, { status: 500 })
  }

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        page,
        gl: 'jp',   // 日本のコンテンツを優先
        hl: 'ja',   // 日本語UIで検索
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[search] Serper API error:', JSON.stringify(data))
      return NextResponse.json(
        { error: data.message || '検索エラー', detail: data },
        { status: res.status }
      )
    }

    const items = (data.organic || []).map((item: {
      title: string
      link: string
      snippet: string
    }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    }))

    return NextResponse.json({
      items,
      totalResults: data.searchParameters?.num || '10',
      hasNext: items.length === 10,
    })
  } catch (e) {
    console.error('[search] Unexpected error:', e)
    return NextResponse.json(
      { error: '検索に失敗しました', detail: String(e) },
      { status: 500 }
    )
  }
}
