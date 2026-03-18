import path from "node:path"
import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import * as API from "../../../../../Core/Api/Auth/Product/uploadImages"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import {
  ImageUrl,
  createImageUrl,
} from "../../../../../Core/App/Product/ProductImageUrl"
import { AuthSeller } from "../../AuthApi"
import { uploadsRoot } from "../../../Uploads"
import ENV from "../../../Env"

const MAX_FILES = 5
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2MB per image

export const contract = API.contract

export async function handler(
  _seller: AuthSeller,
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const files = params.files ?? []
  if (files.length === 0) {
    return err("NO_FILES")
  }

  if (files.length > MAX_FILES) {
    return err("TOO_MANY_FILES")
  }

  const uploaded: ImageUrl[] = []

  for (const file of files) {
    const result = await persistFile(file)
    if (result._t === "Err") {
      return err(result.error)
    }
    uploaded.push(result.value)
  }

  return ok({ urls: uploaded })
}

async function persistFile(
  file: API.UploadImageFile,
): Promise<Result<API.ErrorCode, ImageUrl>> {
  const parsed = parseDataUrl(file.dataUrl)
  if (parsed == null) {
    return err("INVALID_FILE")
  }

  const { mimeType, buffer } = parsed
  if (mimeType.startsWith("image/") === false) {
    return err("INVALID_FILE")
  }

  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
    return err("INVALID_FILE")
  }

  const extension = extensionFromMime(mimeType)
  if (extension == null) {
    return err("INVALID_FILE")
  }

  const filename = `${randomUUID()}${extension}`
  const filePath = path.join(uploadsRoot, filename)

  try {
    await fs.writeFile(filePath, buffer)
    const publicUrl = buildPublicUrl(filename)
    const imageUrl = createImageUrl(publicUrl)
    if (imageUrl == null) {
      return err("UPLOAD_FAILED")
    }
    return ok(imageUrl)
  } catch {
    return err("UPLOAD_FAILED")
  }
}

function parseDataUrl(
  dataUrl: string,
): { mimeType: string; buffer: Buffer } | null {
  const trimmed = dataUrl.trim()
  const match = trimmed.match(/^data:(.+);base64,(.+)$/)
  if (match == null) {
    return null
  }

  const mimeType = match[1]
  try {
    const buffer = Buffer.from(match[2], "base64")
    return { mimeType, buffer }
  } catch {
    return null
  }
}

function extensionFromMime(mime: string): string | null {
  const mapping: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  }

  return mapping[mime] ?? null
}

function buildPublicUrl(filename: string): string {
  const baseEnv = process.env.ASSET_BASE_URL
  const base =
    baseEnv != null && baseEnv.trim() !== ""
      ? baseEnv.replace(/\/$/, "")
      : `http://localhost:${ENV.APP_PORT}`

  return `${base}/uploads/${filename}`
}
