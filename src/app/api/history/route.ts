import { NextResponse } from 'next/server'
import { getMessages } from '@/lib/sheets/client'

export async function GET() {
  try {
    const messages = await getMessages()
    // 最新順に並び替え
    messages.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return NextResponse.json({ messages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
