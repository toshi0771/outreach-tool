import Bull from 'bull'
import { submitForm, checkRobotsTxt } from '@/lib/playwright/form-submitter'
import { getSiteById, getMessageById, updateMessage, updateSite } from '@/lib/sheets/client'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

// キューのインスタンス（シングルトン）
let _queue: Bull.Queue | null = null

export function getFormQueue(): Bull.Queue {
  if (!_queue) {
    _queue = new Bull('form-submissions', REDIS_URL, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      }
    })
    registerProcessor(_queue)
  }
  return _queue
}

export interface SubmitJobData {
  message_id: string
  site_id: string
  sender_name: string
  sender_email: string
  sender_company: string
  sender_phone?: string
}

/**
 * キューにジョブを追加する
 */
export async function enqueueSubmission(data: SubmitJobData, delayMs = 0): Promise<string> {
  const queue = getFormQueue()
  const job = await queue.add(data, { delay: delayMs })
  return String(job.id)
}

/**
 * ワーカー処理の登録
 */
function registerProcessor(queue: Bull.Queue) {
  queue.process(async (job) => {
    const { message_id, site_id, sender_name, sender_email, sender_company, sender_phone } = job.data as SubmitJobData

    console.log(`[Queue] Processing job ${job.id} | message: ${message_id}`)

    // メッセージ・サイトデータを取得
    const msgFound = await getMessageById(message_id)
    const siteFound = await getSiteById(site_id)
    if (!msgFound || !siteFound) {
      throw new Error(`Message or Site not found: ${message_id} / ${site_id}`)
    }

    const { message } = msgFound
    const { site } = siteFound

    // robots.txt チェック
    const allowed = await checkRobotsTxt(site.form_url)
    if (!allowed) {
      await updateMessage(message_id, { result: 'skipped', error_detail: 'robots.txtにより送信スキップ' })
      return { skipped: true }
    }

    // フォーム送信
    const result = await submitForm({
      formUrl: site.form_url,
      subject: message.rendered_subject,
      body: message.rendered_body,
      senderInfo: {
        name: sender_name,
        email: sender_email,
        company: sender_company,
        phone: sender_phone,
      }
    })

    const now = new Date().toISOString()

    if (result.success) {
      await updateMessage(message_id, { result: 'success', sent_at: now })
      await updateSite(site_id, { status: 'sent', last_contact_date: now })
      console.log(`[Queue] ✅ Success: ${site.url}`)
    } else {
      await updateMessage(message_id, { result: 'error', error_detail: result.error ?? '' })
      await updateSite(site_id, { status: 'error' })
      console.error(`[Queue] ❌ Error: ${site.url} | ${result.error}`)
      throw new Error(result.error)  // Bull にリトライさせる
    }

    return { success: true }
  })

  queue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} permanently failed:`, err.message)
    // Slack通知（設定されている場合）
    notifySlack(`❌ 送信失敗 (最終): job=${job.id}\n${err.message}`)
  })

  queue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed`)
  })
}

/**
 * Slack通知（オプション）
 */
async function notifySlack(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {}
}

/**
 * キューの状態を取得
 */
export async function getQueueStatus() {
  const queue = getFormQueue()
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])
  return { waiting, active, completed, failed, delayed }
}
