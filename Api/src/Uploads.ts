import fs from "node:fs"
import path from "node:path"

export const uploadsRoot = path.resolve(process.cwd(), "uploads")

export function ensureUploadsDir(): void {
  if (fs.existsSync(uploadsRoot) === false) {
    fs.mkdirSync(uploadsRoot, { recursive: true })
  }
}
