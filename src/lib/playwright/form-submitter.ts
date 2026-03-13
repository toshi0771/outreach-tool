import { chromium } from 'playwright'

export interface FormSubmitOptions {
  formUrl: string
  subject: string
  body: string
  /** 会社名・送信者名・メールアドレスなど */
  senderInfo: {
    name: string
    email: string
    company: string
    phone?: string
  }
}

export interface FormSubmitResult {
  success: boolean
  error?: string
  screenshotBase64?: string
}

/**
 * Playwright でフォームに自動入力して送信する
 */
export async function submitForm(options: FormSubmitOptions): Promise<FormSubmitResult> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  try {
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP,ja;q=0.9' })

    // ページ読み込み（タイムアウト30秒）
    await page.goto(options.formUrl, { waitUntil: 'networkidle', timeout: 30000 })

    // ===== フォームフィールドの検出と入力 =====
    const filled = await fillFormFields(page, options)
    if (!filled) {
      return { success: false, error: 'フォームフィールドが見つかりませんでした' }
    }

    // ===== 送信ボタンのクリック =====
    const submitted = await clickSubmitButton(page)
    if (!submitted) {
      return { success: false, error: '送信ボタンが見つかりませんでした' }
    }

    // 送信後の待機（リダイレクト等）
    await page.waitForTimeout(3000)

    // 確認ダイアログが出た場合はOKをクリック
    page.on('dialog', async dialog => { await dialog.accept() })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    }
  } finally {
    await browser.close()
  }
}

/**
 * フォームフィールドを検出して入力する
 */
async function fillFormFields(page: any, options: FormSubmitOptions): Promise<boolean> {
  const { senderInfo, subject, body } = options
  let filled = false

  // === 名前フィールド ===
  const nameSelectors = [
    'input[name*="name" i]', 'input[name*="氏名"]', 'input[name*="お名前"]',
    'input[placeholder*="名前"]', 'input[placeholder*="氏名"]', 'input[placeholder*="お名前"]',
    'input[id*="name" i]', 'input[id*="氏名"]'
  ]
  for (const sel of nameSelectors) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(senderInfo.name)
        filled = true
        break
      }
    } catch {}
  }

  // === 会社名フィールド ===
  const companySelectors = [
    'input[name*="company" i]', 'input[name*="会社"]', 'input[name*="organization" i]',
    'input[placeholder*="会社名"]', 'input[id*="company" i]'
  ]
  for (const sel of companySelectors) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(senderInfo.company)
        break
      }
    } catch {}
  }

  // === メールアドレスフィールド ===
  const emailSelectors = [
    'input[type="email"]', 'input[name*="email" i]', 'input[name*="mail" i]',
    'input[placeholder*="メール"]', 'input[placeholder*="Email"]', 'input[id*="email" i]'
  ]
  for (const sel of emailSelectors) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(senderInfo.email)
        break
      }
    } catch {}
  }

  // === 電話番号フィールド ===
  if (senderInfo.phone) {
    const telSelectors = [
      'input[type="tel"]', 'input[name*="tel" i]', 'input[name*="phone" i]',
      'input[name*="電話"]', 'input[placeholder*="電話"]'
    ]
    for (const sel of telSelectors) {
      try {
        const el = page.locator(sel).first()
        if (await el.isVisible({ timeout: 1000 })) {
          await el.fill(senderInfo.phone)
          break
        }
      } catch {}
    }
  }

  // === 件名フィールド ===
  if (subject) {
    const subjectSelectors = [
      'input[name*="subject" i]', 'input[name*="件名"]', 'input[name*="タイトル"]',
      'input[placeholder*="件名"]', 'input[id*="subject" i]'
    ]
    for (const sel of subjectSelectors) {
      try {
        const el = page.locator(sel).first()
        if (await el.isVisible({ timeout: 1000 })) {
          await el.fill(subject)
          break
        }
      } catch {}
    }
  }

  // === 本文フィールド（textarea）===
  const bodySelectors = [
    'textarea[name*="message" i]', 'textarea[name*="content" i]', 'textarea[name*="body" i]',
    'textarea[name*="お問い合わせ"]', 'textarea[name*="内容"]', 'textarea[name*="本文"]',
    'textarea[placeholder*="お問い合わせ"]', 'textarea[placeholder*="内容"]',
    'textarea[id*="message" i]', 'textarea[id*="content" i]',
    'textarea'  // フォールバック: 最初のtextarea
  ]
  for (const sel of bodySelectors) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(body)
        filled = true
        break
      }
    } catch {}
  }

  return filled
}

/**
 * 送信ボタンを見つけてクリックする
 */
async function clickSubmitButton(page: any): Promise<boolean> {
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("送信")',
    'button:has-text("確認")',
    'button:has-text("Submit")',
    'button:has-text("Send")',
    'a:has-text("送信する")',
  ]

  for (const sel of submitSelectors) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 1000 })) {
        await el.click()
        return true
      }
    } catch {}
  }
  return false
}

/**
 * robots.txtを確認し、フォームURLへのアクセスが許可されているか確認
 */
export async function checkRobotsTxt(formUrl: string): Promise<boolean> {
  try {
    const url = new URL(formUrl)
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return true  // robots.txtがなければ許可とみなす

    const text = await res.text()
    const lines = text.split('\n')
    let isUserAgentAll = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        isUserAgentAll = trimmed.includes('*')
      }
      if (isUserAgentAll && trimmed.toLowerCase().startsWith('disallow:')) {
        const disallowedPath = trimmed.split(':')[1]?.trim()
        if (disallowedPath && url.pathname.startsWith(disallowedPath)) {
          return false  // アクセス禁止
        }
      }
    }
    return true
  } catch {
    return true  // エラー時は許可とみなす
  }
}
