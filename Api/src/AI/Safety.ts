const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all|any|previous|prior|earlier)\s+(instructions?|rules?)/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /tool\s*call/i,
  /function\s*call/i,
  /execute\s+sql/i,
  /drop\s+table/i,
  /\bselect\b\s+.*\bfrom\b/i,
  /<script/i,
]

export function stripPromptInjectionDirectives(text: string): string {
  const cleanedLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .filter(
      (line) =>
        !PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(line)),
    )

  return cleanedLines.join(" ").replace(/\s+/g, " ").trim()
}

export function sanitizeRetrievedContext(text: string): string {
  const cleanedLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .filter(
      (line) =>
        !PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(line)),
    )

  return cleanedLines.join("\n").trim()
}

export function redactPIIPatterns(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[redacted-phone]")
    .replace(/\b\d{10,19}\b/g, "[redacted-number]")
}
