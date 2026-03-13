import { google, sheets_v4 } from 'googleapis'
import type { Site, Template, Message, SiteStatus, MessageResult } from '@/types'

// ===== 認証 =====
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
  const creds = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!

// ===== ユーティリティ =====
async function readSheet(range: string): Promise<string[][]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })
  return (res.data.values ?? []) as string[][]
}

async function appendRow(sheetName: string, values: string[]): Promise<void> {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

async function updateRow(sheetName: string, rowIndex: number, values: string[]): Promise<void> {
  const sheets = getSheets()
  const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheets = getSheets()
  // シートのIDを取得
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName)
  if (!sheet?.properties?.sheetId) throw new Error('Sheet not found')
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          }
        }
      }]
    }
  })
}

// ===== シート初期化（初回のみ実行） =====
export async function initializeSheets(): Promise<void> {
  const sheets = getSheets()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const existing = meta.data.sheets?.map(s => s.properties?.title) ?? []

  const toCreate = ['sites', 'templates', 'messages'].filter(n => !existing.includes(n))
  if (toCreate.length === 0) return

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: toCreate.map(title => ({ addSheet: { properties: { title } } }))
    }
  })

  // ヘッダー行の追加
  if (toCreate.includes('sites')) {
    await appendRow('sites', ['id','url','form_url','title','category','region','status','last_contact_date','memo','created_at'])
  }
  if (toCreate.includes('templates')) {
    await appendRow('templates', ['id','name','subject','body','variables','created_at'])
  }
  if (toCreate.includes('messages')) {
    await appendRow('messages', ['id','site_id','template_id','rendered_body','rendered_subject','approved','approved_by','sent_at','result','error_detail','created_at'])
  }
}

// ===== SITES =====
function rowToSite(row: string[]): Site {
  return {
    id: row[0] ?? '',
    url: row[1] ?? '',
    form_url: row[2] ?? '',
    title: row[3] ?? '',
    category: row[4] ?? '',
    region: row[5] ?? '',
    status: (row[6] ?? 'pending') as SiteStatus,
    last_contact_date: row[7] ?? '',
    memo: row[8] ?? '',
    created_at: row[9] ?? '',
  }
}

function siteToRow(s: Site): string[] {
  return [s.id, s.url, s.form_url, s.title, s.category, s.region, s.status, s.last_contact_date, s.memo, s.created_at]
}

export async function getSites(): Promise<Site[]> {
  const rows = await readSheet('sites!A2:J')
  return rows.filter(r => r[0]).map(rowToSite)
}

export async function getSiteById(id: string): Promise<{ site: Site; rowIndex: number } | null> {
  const rows = await readSheet('sites!A2:J')
  const idx = rows.findIndex(r => r[0] === id)
  if (idx === -1) return null
  return { site: rowToSite(rows[idx]), rowIndex: idx + 2 }
}

export async function createSite(site: Site): Promise<void> {
  await appendRow('sites', siteToRow(site))
}

export async function updateSite(id: string, data: Partial<Site>): Promise<boolean> {
  const found = await getSiteById(id)
  if (!found) return false
  const updated = { ...found.site, ...data }
  await updateRow('sites', found.rowIndex, siteToRow(updated))
  return true
}

export async function deleteSite(id: string): Promise<boolean> {
  const found = await getSiteById(id)
  if (!found) return false
  await deleteRow('sites', found.rowIndex)
  return true
}

export async function isDuplicateUrl(url: string, excludeId?: string): Promise<boolean> {
  const sites = await getSites()
  return sites.some(s => s.url === url && s.id !== excludeId)
}

// ===== TEMPLATES =====
function rowToTemplate(row: string[]): Template {
  let variables: string[] = []
  try { variables = JSON.parse(row[4] ?? '[]') } catch {}
  return {
    id: row[0] ?? '',
    name: row[1] ?? '',
    subject: row[2] ?? '',
    body: row[3] ?? '',
    variables,
    created_at: row[5] ?? '',
  }
}

function templateToRow(t: Template): string[] {
  return [t.id, t.name, t.subject, t.body, JSON.stringify(t.variables), t.created_at]
}

export async function getTemplates(): Promise<Template[]> {
  const rows = await readSheet('templates!A2:F')
  return rows.filter(r => r[0]).map(rowToTemplate)
}

export async function getTemplateById(id: string): Promise<{ template: Template; rowIndex: number } | null> {
  const rows = await readSheet('templates!A2:F')
  const idx = rows.findIndex(r => r[0] === id)
  if (idx === -1) return null
  return { template: rowToTemplate(rows[idx]), rowIndex: idx + 2 }
}

export async function createTemplate(t: Template): Promise<void> {
  await appendRow('templates', templateToRow(t))
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<boolean> {
  const found = await getTemplateById(id)
  if (!found) return false
  const updated = { ...found.template, ...data }
  await updateRow('templates', found.rowIndex, templateToRow(updated))
  return true
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const found = await getTemplateById(id)
  if (!found) return false
  await deleteRow('templates', found.rowIndex)
  return true
}

// ===== MESSAGES =====
function rowToMessage(row: string[]): Message {
  return {
    id: row[0] ?? '',
    site_id: row[1] ?? '',
    template_id: row[2] ?? '',
    rendered_body: row[3] ?? '',
    rendered_subject: row[4] ?? '',
    approved: row[5] === 'TRUE',
    approved_by: row[6] ?? '',
    sent_at: row[7] ?? '',
    result: (row[8] ?? 'pending') as MessageResult,
    error_detail: row[9] ?? '',
    created_at: row[10] ?? '',
  }
}

function messageToRow(m: Message): string[] {
  return [m.id, m.site_id, m.template_id, m.rendered_body, m.rendered_subject,
    m.approved ? 'TRUE' : 'FALSE', m.approved_by, m.sent_at, m.result, m.error_detail, m.created_at]
}

export async function getMessages(): Promise<Message[]> {
  const rows = await readSheet('messages!A2:K')
  return rows.filter(r => r[0]).map(rowToMessage)
}

export async function getMessageById(id: string): Promise<{ message: Message; rowIndex: number } | null> {
  const rows = await readSheet('messages!A2:K')
  const idx = rows.findIndex(r => r[0] === id)
  if (idx === -1) return null
  return { message: rowToMessage(rows[idx]), rowIndex: idx + 2 }
}

export async function createMessage(m: Message): Promise<void> {
  await appendRow('messages', messageToRow(m))
}

export async function updateMessage(id: string, data: Partial<Message>): Promise<boolean> {
  const found = await getMessageById(id)
  if (!found) return false
  const updated = { ...found.message, ...data }
  await updateRow('messages', found.rowIndex, messageToRow(updated))
  return true
}

// ===== 統計 =====
export async function getDashboardStats() {
  const [sites, messages] = await Promise.all([getSites(), getMessages()])
  const today = new Date().toISOString().split('T')[0]
  const todaySent = messages.filter(m => m.sent_at.startsWith(today) && m.result === 'success').length
  const counts = sites.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  return {
    total: sites.length,
    pending: counts.pending ?? 0,
    approved: counts.approved ?? 0,
    queued: counts.queued ?? 0,
    sent: counts.sent ?? 0,
    replied: counts.replied ?? 0,
    opted_out: counts.opted_out ?? 0,
    error: counts.error ?? 0,
    today_sent: todaySent,
    daily_limit: Number(process.env.DAILY_SEND_LIMIT ?? 50),
  }
}
