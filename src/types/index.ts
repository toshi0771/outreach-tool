// ===== サイト =====
export type SiteStatus =
  | 'pending'
  | 'approved'
  | 'queued'
  | 'sent'
  | 'replied'
  | 'opted_out'
  | 'error'

export interface Site {
  id: string
  url: string
  form_url: string
  title: string
  category: string
  region: string
  status: SiteStatus
  last_contact_date: string
  memo: string
  created_at: string
}

// ===== テンプレート =====
export interface Template {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]   // ['会社名', '担当者名'] など
  created_at: string
}

// ===== メッセージ（送信キュー・履歴） =====
export type MessageResult = 'pending' | 'success' | 'error' | 'skipped'

export interface Message {
  id: string
  site_id: string
  template_id: string
  rendered_body: string
  rendered_subject: string
  approved: boolean
  approved_by: string
  sent_at: string
  result: MessageResult
  error_detail: string
  created_at: string
}

// ===== ダッシュボード統計 =====
export interface DashboardStats {
  total: number
  pending: number
  approved: number
  queued: number
  sent: number
  replied: number
  opted_out: number
  error: number
  today_sent: number
  daily_limit: number
}

// ===== フィルター =====
export interface SiteFilter {
  category?: string
  region?: string
  status?: SiteStatus | ''
  search?: string
}

// ===== バッチ承認 =====
export interface BatchPreviewRequest {
  site_ids: string[]
  template_id: string
  variables_map: Record<string, Record<string, string>>  // site_id -> {変数名: 値}
}

export interface BatchPreviewItem {
  site: Site
  rendered_subject: string
  rendered_body: string
}
