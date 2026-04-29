import { createHash } from "node:crypto"
import type { Schema } from "../Database"
import {
  type AIRagPhase,
  type VectorDocumentMeta,
  type VectorScope,
  filterIngestionRow,
  getCurrentRagPhase,
  getVectorIngestionPolicy,
} from "./SecurityPolicy"

export type IngestionSource = {
  table: keyof Schema
  rowId: string
  updatedAt: Date
}

export type VectorDocumentDraft = {
  sourceTable: keyof Schema
  sourceRowId: string
  sourceUpdatedAt: Date
  chunkIndex: number
  content: string
  contentHash: string
  access: VectorDocumentMeta
  metadata: Record<string, unknown>
}

export type BuildVectorDocumentDraftInput = {
  source: IngestionSource
  row: Record<string, unknown>
  phase?: AIRagPhase
  chunkIndex?: number
  chunkSize?: number
  chunkOverlap?: number
  accessOverride?: Partial<VectorDocumentMeta>
}

export function buildVectorDocumentDraft(
  input: BuildVectorDocumentDraftInput,
): VectorDocumentDraft | null {
  const drafts = buildVectorDocumentDrafts(input)

  return drafts.length === 0 ? null : drafts[0]
}

export function buildVectorDocumentDrafts(
  input: BuildVectorDocumentDraftInput,
): VectorDocumentDraft[] {
  const phase = input.phase ?? getCurrentRagPhase()
  const policy = getVectorIngestionPolicy(input.source.table, phase)
  if (policy === null) {
    return []
  }

  const sanitizedRow = filterIngestionRow(input.source.table, input.row, phase)
  if (Object.keys(sanitizedRow).length === 0) {
    return []
  }

  const access = _resolveAccess({
    policyScope: policy.scope,
    row: input.row,
    accessOverride: input.accessOverride,
  })

  const content = _buildContent(input.source.table, sanitizedRow)
  const chunkSize = Math.max(250, Math.min(input.chunkSize ?? 1200, 6000))
  const chunkOverlap = Math.max(
    0,
    Math.min(input.chunkOverlap ?? 120, Math.floor(chunkSize / 3)),
  )
  const chunks = _chunkContent(content, chunkSize, chunkOverlap)

  if (chunks.length === 0) {
    return []
  }

  const baseMetadata: Record<string, unknown> = {
    sourceTable: input.source.table,
    sourceRowId: input.source.rowId,
    sourceUpdatedAt: input.source.updatedAt.toISOString(),
    columnCount: Object.keys(sanitizedRow).length,
    chunkCount: chunks.length,
  }

  const initialChunkIndex = input.chunkIndex ?? 0

  return chunks.map((chunk, index) => {
    const chunkIndex = initialChunkIndex + index
    const contentHash = _hash(
      `${input.source.table}:${input.source.rowId}:${access.scope}:${chunkIndex}:${chunk}`,
    )

    return {
      sourceTable: input.source.table,
      sourceRowId: input.source.rowId,
      sourceUpdatedAt: input.source.updatedAt,
      chunkIndex,
      content: chunk,
      contentHash,
      access,
      metadata: {
        ...baseMetadata,
        chunkIndex,
      },
    }
  })
}

function _resolveAccess(params: {
  policyScope: VectorScope
  row: Record<string, unknown>
  accessOverride?: Partial<VectorDocumentMeta>
}): VectorDocumentMeta {
  const scope = params.accessOverride?.scope ?? params.policyScope
  const ownerId =
    params.accessOverride?.ownerId ?? _readString(params.row, "userId")
  const shopId =
    params.accessOverride?.shopId ?? _readString(params.row, "sellerId")

  if (scope === "USER_PRIVATE") {
    return {
      scope,
      ownerId: _normalizeNullableId(ownerId),
      shopId: null,
    }
  }

  if (scope === "SELLER_PRIVATE") {
    return {
      scope,
      ownerId: null,
      shopId: _normalizeNullableId(shopId),
    }
  }

  return {
    scope,
    ownerId: null,
    shopId: null,
  }
}

function _chunkContent(
  value: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const normalized = value.trim()
  if (normalized === "") {
    return []
  }

  if (normalized.length <= chunkSize) {
    return [normalized]
  }

  const chunks: string[] = []
  let cursor = 0

  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + chunkSize)
    const chunk = normalized.slice(cursor, end).trim()

    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    if (end >= normalized.length) {
      break
    }

    cursor = Math.max(end - overlap, cursor + 1)
  }

  return chunks
}

function _readString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === "string" ? value : null
}

function _normalizeNullableId(value: string | null): string | null {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function _buildContent(
  table: keyof Schema,
  row: Record<string, unknown>,
): string {
  switch (table) {
    case "product":
      return _buildProductContent(row)
    case "product_variant":
      return _buildProductVariantContent(row)
    case "seller":
      return _buildSellerContent(row)
    case "category":
      return _buildCategoryContent(row)
    case "voucher":
      return _buildVoucherContent(row)
    case "poster":
      return _buildPosterContent(row)
    case "market_config":
      return _buildMarketConfigContent(row)
    default:
      return _buildGenericContent(row)
  }
}

function _buildProductContent(row: Record<string, unknown>): string {
  const name = _str(row, "name")
  const price = _num(row, "price")
  const description = _str(row, "description")
  const attributes = row["attributes"]

  const lines: string[] = [
    `Product: ${name}`,
    `Price: ${price != null ? `${price.toLocaleString()} VND` : "unknown"}`,
  ]

  if (description != null && description.trim() !== "") {
    lines.push(`Description: ${description}`)
  }

  if (attributes != null) {
    const attrStr =
      typeof attributes === "string" ? attributes : JSON.stringify(attributes)
    if (attrStr.trim() !== "" && attrStr !== "null") {
      lines.push(`Attributes: ${attrStr}`)
    }
  }

  return lines.join("\n")
}

function _buildProductVariantContent(row: Record<string, unknown>): string {
  const name = _str(row, "name")
  const sku = _str(row, "sku")
  const price = _num(row, "price")
  const stock = _num(row, "stock")

  const lines: string[] = [`Product variant: ${name ?? "unnamed"}`]

  if (sku != null) lines.push(`SKU: ${sku}`)
  if (price != null) lines.push(`Price: ${price.toLocaleString()} VND`)
  if (stock != null) lines.push(`Stock: ${stock} units available`)

  return lines.join("\n")
}

function _buildSellerContent(row: Record<string, unknown>): string {
  const shopName = _str(row, "shopName")
  const name = _str(row, "name")
  const description = _str(row, "shopDescription")
  const verified = row["verified"]
  const tier = _str(row, "tier")
  const vacation = row["vacationMode"]

  const lines: string[] = [`Shop: ${shopName ?? name ?? "unknown"}`]

  if (verified === true) lines.push("Verified seller")
  if (tier != null) lines.push(`Tier: ${tier}`)
  if (vacation === true)
    lines.push("Currently on vacation mode (not accepting orders)")
  if (description != null && description.trim() !== "") {
    lines.push(`Description: ${description}`)
  }

  return lines.join("\n")
}

function _buildCategoryContent(row: Record<string, unknown>): string {
  const name = _str(row, "name")
  const slug = _str(row, "slug")

  const lines: string[] = [`Category: ${name ?? "unknown"}`]
  if (slug != null) lines.push(`Slug: ${slug}`)

  return lines.join("\n")
}

function _buildVoucherContent(row: Record<string, unknown>): string {
  const code = _str(row, "code")
  const name = _str(row, "name")
  const discount = _num(row, "discount")
  const minOrder = _num(row, "minOrderValue")
  const limit = _num(row, "limit")
  const usedCount = _num(row, "usedCount")
  const active = row["active"]
  const expiry = _str(row, "expiredDate")

  const lines: string[] = [`Voucher: ${name ?? code ?? "unknown"}`]

  if (code != null) lines.push(`Code: ${code}`)
  if (discount != null) lines.push(`Discount: ${discount}%`)
  if (minOrder != null)
    lines.push(`Minimum order value: ${minOrder.toLocaleString()} VND`)
  if (limit != null && usedCount != null) {
    lines.push(`Usage: ${usedCount}/${limit} used`)
  }
  if (active === false) lines.push("Status: inactive")
  else if (active === true) lines.push("Status: active")
  if (expiry != null) lines.push(`Expires: ${expiry}`)

  return lines.join("\n")
}

function _buildPosterContent(row: Record<string, unknown>): string {
  const name = _str(row, "name")
  const description = _str(row, "description")
  const isPermanent = row["isPermanent"]
  const startDate = _str(row, "startDate")
  const endDate = _str(row, "endDate")

  const lines: string[] = [`Promotion poster: ${name ?? "unnamed"}`]

  if (description != null && description.trim() !== "") {
    lines.push(`Description: ${description}`)
  }
  if (isPermanent === true) {
    lines.push("This is a permanent promotion")
  } else {
    if (startDate != null) lines.push(`Start: ${startDate}`)
    if (endDate != null) lines.push(`End: ${endDate}`)
  }

  return lines.join("\n")
}

function _buildMarketConfigContent(row: Record<string, unknown>): string {
  const reportWindow = _num(row, "reportWindowHours")
  const ratingReportMax = _num(row, "ratingReportMaxPerDay")

  const lines: string[] = ["Platform configuration:"]

  if (reportWindow != null) {
    lines.push(`Report window: ${reportWindow} hours`)
  }
  if (ratingReportMax != null) {
    lines.push(`Maximum rating reports per day: ${ratingReportMax}`)
  }

  return lines.join("\n")
}

function _buildGenericContent(row: Record<string, unknown>): string {
  const sortedKeys = Object.keys(row).sort((a, b) => a.localeCompare(b))
  return sortedKeys
    .map((key) => `${key}: ${_serializeValue(row[key])}`)
    .join("\n")
}

function _str(row: Record<string, unknown>, key: string): string | null {
  const v = row[key]
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null
}

function _num(row: Record<string, unknown>, key: string): number | null {
  const v = row[key]
  const n = Number(v)
  return v != null && Number.isFinite(n) ? n : null
}

function _serializeValue(value: unknown): string {
  if (value === null) {
    return "null"
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }

  const encoded = JSON.stringify(value)
  return encoded === undefined ? "undefined" : encoded
}

function _hash(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}
