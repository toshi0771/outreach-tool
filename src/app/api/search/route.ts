import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const start = searchParams.get('start') || '1'

  if (!query) return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 })

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_CX

  if (!apiKey || !cx) {
    return NextResponse.json({ error: 'Google Search APIの設定がありません' }, { status: 500 })
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&start=${start}&num=10`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || '検索エラー' }, { status: res.status })
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
    return NextResponse.json({ error: '検索に失敗しました' }, { status: 500 })
  }
}
