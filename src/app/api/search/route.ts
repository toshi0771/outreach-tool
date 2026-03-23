import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const startParam = searchParams.get('start') || '1'
  // startは1〜91の整数に制限（APIの制約: start + num <= 100）
  const start = Math.max(1, Math.min(91, parseInt(startParam, 10) || 1))

  if (!query) return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 })

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_CX

  if (!apiKey || !cx) {
    return NextResponse.json({ error: 'Google Search APIの設定がありません' }, { status: 500 })
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', cx)
    url.searchParams.set('q', query)
    url.searchParams.set('start', String(start))
    url.searchParams.set('num', '10')
    url.searchParams.set('lr', 'lang_ja')  // 日本語コンテンツに絞る
    url.searchParams.set('gl', 'jp')        // 日本のコンテンツを優先

    const res = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok) {
      const message = data.error?.message || '検索エラー'
      const status = data.error?.code || res.status
      console.error('[search] Google API error:', JSON.stringify(data.error))
      return NextResponse.json(
        { error: message, detail: data.error },
        { status }
      )
    }

    const items = (data.items || []).map((item: { title: string; link: string; snippet: string }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    }))

    return NextResponse.json({
      items,
      totalResults: data.searchInformation?.totalResults || '0',
      hasNext: !!data.queries?.nextPage,
    })
  } catch (e) {
    console.error('[search] Unexpected error:', e)
    return NextResponse.json(
      { error: '検索に失敗しました', detail: String(e) },
      { status: 500 }
    )
  }
}
