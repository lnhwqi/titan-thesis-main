import { createHash } from "node:crypto"
import type { Schema } from "../Database"
import {
  VectorDocumentMeta,
  filterIngestionRow,
  getVectorIngestionPolicy,
} from "./SecurityPolicy"

export type IngestionSource = {
  table: keyof Schema
  rowId: string
  updatedAt: Date
}

export type IngestionParticipants = {
  participantUserIds: string[]
  participantSellerIds: string[]
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
  chunkIndex?: number
  participants?: Partial<IngestionParticipants>
}

export function buildVectorDocumentDraft(
  input: BuildVectorDocumentDraftInput,
): VectorDocumentDraft | null {
  const policy = getVectorIngestionPolicy(input.source.table)
  if (policy === null) {
    return null
  }

  const chunkIndex = input.chunkIndex ?? 0
  const sanitizedRow = filterIngestionRow(input.source.table, input.row)
  if (Object.keys(sanitizedRow).length === 0) {
    return null
  }

  const access: VectorDocumentMeta = {
    scope: policy.scope,
    participantUserIds: _normalizeParticipantIds(
      input.participants?.participantUserIds ?? [],
    ),
    participantSellerIds: _normalizeParticipantIds(
      input.participants?.participantSellerIds ?? [],
    ),
  }

  const content = _buildContent(sanitizedRow)
  const contentHash = _hash(
    `${input.source.table}:${input.source.rowId}:${chunkIndex}:${content}`,
  )

  const metadata: Record<string, unknown> = {
    sourceTable: input.source.table,
    sourceRowId: input.source.rowId,
    sourceUpdatedAt: input.source.updatedAt.toISOString(),
    chunkIndex,
    columnCount: Object.keys(sanitizedRow).length,
  }

  return {
    sourceTable: input.source.table,
    sourceRowId: input.source.rowId,
    sourceUpdatedAt: input.source.updatedAt,
    chunkIndex,
    content,
    contentHash,
    access,
    metadata,
  }
}

function _normalizeParticipantIds(ids: string[]): string[] {
  const unique = Array.from(
    new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)),
  )
  unique.sort((a, b) => a.localeCompare(b))
  return unique
}

function _buildContent(row: Record<string, unknown>): string {
  const sortedKeys = Object.keys(row).sort((a, b) => a.localeCompare(b))
  return sortedKeys
    .map((key) => `${key}: ${_serializeValue(row[key])}`)
    .join("\n")
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
