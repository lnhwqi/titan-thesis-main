import { createTransport, Transporter } from "nodemailer"
import * as Logger from "../Logger"

type SendOtpMailParams = {
  to: string
  otpCode: string
  purpose: "USER_REGISTER" | "SELLER_REGISTER" | "USER_PAYMENT"
  expiresInSeconds: number
  recipientName?: string | null
}

let cachedTransporter: Transporter | null = null
let usingFallbackTransport = false

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

function createTransporter(): Transporter {
  const host = (process.env.SMTP_HOST ?? "").trim()
  const user = (process.env.SMTP_USER ?? "").trim()
  const pass = (process.env.SMTP_PASS ?? "").trim()

  if (host !== "" && user !== "" && pass !== "") {
    const port = parsePositiveInt(process.env.SMTP_PORT, 587)
    const secure =
      String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true"

    usingFallbackTransport = false
    return createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    })
  }

  usingFallbackTransport = true
  Logger.warn(
    "SMTP_HOST/SMTP_USER/SMTP_PASS are missing. Falling back to Nodemailer json transport.",
  )

  return createTransport({
    jsonTransport: true,
  })
}

function getTransporter(): Transporter {
  if (cachedTransporter == null) {
    cachedTransporter = createTransporter()
  }

  return cachedTransporter
}

function otpPurposeLabel(purpose: SendOtpMailParams["purpose"]): string {
  switch (purpose) {
    case "USER_REGISTER":
      return "user registration"
    case "SELLER_REGISTER":
      return "seller registration"
    case "USER_PAYMENT":
      return "wallet payment"
  }
}

export async function sendOtpMail(params: SendOtpMailParams): Promise<boolean> {
  const transporter = getTransporter()
  const from =
    (process.env.SMTP_FROM ?? "").trim() ||
    (process.env.SMTP_USER ?? "").trim() ||
    "no-reply@titan.local"

  const purpose = otpPurposeLabel(params.purpose)
  const recipient = (params.recipientName ?? "").trim()
  const greeting = recipient === "" ? "Hello," : `Hello ${recipient},`

  const text = [
    greeting,
    "",
    `Your one-time password for ${purpose} is: ${params.otpCode}`,
    `It expires in ${params.expiresInSeconds} seconds.`,
    "",
    "If you did not request this code, please ignore this email.",
  ].join("\n")

  try {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: `Your OTP Code (${params.otpCode})`,
      text,
    })

    if (usingFallbackTransport && process.env.NODE_ENV !== "production") {
      Logger.warn(
        `[OTP_DEV_ONLY] json transport active. OTP for ${params.to} (${params.purpose}) is ${params.otpCode}`,
      )
    }

    return true
  } catch (error) {
    Logger.error(`Failed to send OTP email: ${String(error)}`)
    return false
  }
}
