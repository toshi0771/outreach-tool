/**
 * テンプレートの変数置換
 * {会社名} → 実際の値 に置換する
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{([^}]+)\}/g, (_, key) => variables[key] ?? `{${key}}`)
}

/**
 * テンプレート本文から変数名を抽出する
 * "こんにちは、{会社名}の{担当者名}様" → ['会社名', '担当者名']
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{([^}]+)\}/g)
  return [...new Set([...matches].map(m => m[1]))]
}
