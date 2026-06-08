import * as Hash from "./Hash"
import * as Mailer from "./Mailer"

export type OtpPurpose = "USER_REGISTER" | "SELLER_REGISTER" | "USER_PAYMENT"

type OtpRecord = {
  hashedCode: string
  expiresAt: number
  attemptsLeft: number
  resendAvailableAt: number
}

type IssueOtpSuccess = {
  type: "SUCCESS"
  expiresInSeconds: number
}

type IssueOtpRateLimited = {
  type: "RATE_LIMITED"
  retryAfterSeconds: number
}

type IssueOtpFailure = {
  type: "FAILED"
}

export type IssueOtpResult =
  | IssueOtpSuccess
  | IssueOtpRateLimited
  | IssueOtpFailure

export type VerifyOtpResult =
  | "VERIFIED"
  | "OTP_NOT_REQUESTED"
  | "OTP_EXPIRED"
  | "OTP_INVALID"

const otpStore = new Map<string, OtpRecord>()

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

function settings(): {
  ttlSeconds: number
  maxAttempts: number
  resendCooldownSeconds: number
} {
  return {
    ttlSeconds: parsePositiveInt(process.env.OTP_TTL_SECONDS, 300),
    maxAttempts: parsePositiveInt(process.env.OTP_MAX_ATTEMPTS, 5),
    resendCooldownSeconds: parsePositiveInt(
      process.env.OTP_RESEND_COOLDOWN_SECONDS,
      60,
    ),
  }
}

function keyOf(purpose: OtpPurpose, target: string): string {
  return `${purpose}:${target.trim().toLowerCase()}`
}

function cleanupExpired(now: number): void {
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt <= now) {
      otpStore.delete(key)
    }
  }
}

function generateSixDigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function issueOtp(params: {
  purpose: OtpPurpose
  target: string
  recipientName?: string | null
}): Promise<IssueOtpResult> {
  const now = Date.now()
  cleanupExpired(now)

  const config = settings()
  const key = keyOf(params.purpose, params.target)
  const existing = otpStore.get(key)

  if (existing != null && now < existing.resendAvailableAt) {
    return {
      type: "RATE_LIMITED",
      retryAfterSeconds: Math.ceil((existing.resendAvailableAt - now) / 1000),
    }
  }

  const otpCode = generateSixDigitOtp()
  const hashedCode = await Hash.issue(otpCode)
  if (hashedCode == null) {
    return { type: "FAILED" }
  }

  const nextRecord: OtpRecord = {
    hashedCode: hashedCode.unwrap(),
    expiresAt: now + config.ttlSeconds * 1000,
    attemptsLeft: config.maxAttempts,
    resendAvailableAt: now + config.resendCooldownSeconds * 1000,
  }

  otpStore.set(key, nextRecord)

  const sent = await Mailer.sendOtpMail({
    to: params.target,
    otpCode,
    purpose: params.purpose,
    expiresInSeconds: config.ttlSeconds,
    recipientName: params.recipientName,
  })

  if (!sent) {
    otpStore.delete(key)
    return { type: "FAILED" }
  }

  return {
    type: "SUCCESS",
    expiresInSeconds: config.ttlSeconds,
  }
}

export async function verifyOtp(params: {
  purpose: OtpPurpose
  target: string
  otpCode: string
}): Promise<VerifyOtpResult> {
  const now = Date.now()
  cleanupExpired(now)

  const key = keyOf(params.purpose, params.target)
  const record = otpStore.get(key)

  if (record == null) {
    return "OTP_NOT_REQUESTED"
  }

  if (now >= record.expiresAt) {
    otpStore.delete(key)
    return "OTP_EXPIRED"
  }

  const isValid = await Hash.verify(params.otpCode.trim(), record.hashedCode)
  if (!isValid) {
    record.attemptsLeft -= 1
    if (record.attemptsLeft <= 0) {
      otpStore.delete(key)
    } else {
      otpStore.set(key, record)
    }

    return "OTP_INVALID"
  }

  otpStore.delete(key)
  return "VERIFIED"
}
