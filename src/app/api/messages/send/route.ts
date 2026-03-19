import { NextRequest, NextResponse } from 'next/server'
import { getMessages } from '../../../lib/sheets/client'
import { enqueueSubmission } from '../../../lib/queue/processor'

const MIN_MS = Number(process.env.SEND_INTERVAL_MIN ?? 30) * 1000
const MAX_MS = Number(process.env.SEND_INTERVAL_MAX ?? 180) * 1000

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// POST /api/messages/send — 承認済みメッセージをすべてキューに投入
export async function POST(req: NextRequest) {
  try {
    const { sender_name, sender_email, sender_company, sender_phone } = await req.json()

    if (!sender_name || !sender_email || !sender_company) {
      return NextResponse.json({ error: '送信者情報（名前・メール・会社名）は必須です' }, { status: 400 })
    }

    const messages = await getMessages()
    const pending = messages.filter(m => m.approved && m.result === 'pending')

    if (pending.length === 0) {
      return NextResponse.json({ error: '送信可能なメッセージがありません' }, { status: 400 })
    }

    let totalDelay = 0
    const jobs = []
    for (const msg of pending) {
      totalDelay += randomDelay(MIN_MS, MAX_MS)
      const jobId = await enqueueSubmission({
        message_id: msg.id,
        site_id: msg.site_id,
        sender_name,
        sender_email,
        sender_company,
        sender_phone,
      }, totalDelay)
      jobs.push(jobId)
    }

    return NextResponse.json({
      queued: pending.length,
      estimated_minutes: Math.ceil(totalDelay / 60000),
      job_ids: jobs,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/messages/send — キュー内の承認済みメッセージ一覧
export async function GET() {
  try {
    const messages = await getMessages()
    const queue = messages.filter(m => m.approved && m.result === 'pending')
    return NextResponse.json({ queue, count: queue.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
