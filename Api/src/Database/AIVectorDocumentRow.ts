import { randomUUID } from "node:crypto"
import { sql } from "kysely"
import db from "../Database"
import type { Schema } from "../Database"
import * as Logger from "../Logger"
import { VectorDocumentDraft } from "../AI/IngestionContract"
import {
  ActorContext,
  VectorScope,
  canActorReadVectorDocument,
} from "../AI/SecurityPolicy"

const vectorTable = "ai_vector_document"
const checkpointTable = "ai_ingestion_checkpoint"

export type AIVectorDocumentRow = {
  id: string
  sourceTable: string
  sourceRowId: string
  sourceUpdatedAt: Date
  chunkIndex: number
  content: string
  contentHash: string
  scope: VectorScope
  ownerId: string | null
  shopId: string | null
  participantUserIds: string[]
  participantSellerIds: string[]
  metadata: Record<string, unknown>
  embedding: unknown
  createdAt: Date
  updatedAt: Date
}

export type UpsertDraftResult = {
  row: AIVectorDocumentRow
  changed: boolean
}

export type AIIngestionCheckpointRow = {
  tableName: string
  lastSourceUpdatedAt: Date | null
  lastRunAt: Date
  updatedAt: Date
  createdAt: Date
}

export async function upsertDraft(
  draft: VectorDocumentDraft,
): Promise<UpsertDraftResult> {
  const existing = await db
    .selectFrom(vectorTable)
    .selectAll()
    .where("sourceTable", "=", String(draft.sourceTable))
    .where("sourceRowId", "=", draft.sourceRowId)
    .where("chunkIndex", "=", draft.chunkIndex)
    .executeTakeFirst()

  if (existing != null && _isDraftUnchanged(existing, draft)) {
    return {
      row: existing,
      changed: false,
    }
  }

  const now = new Date()

  const row = await db
    .insertInto(vectorTable)
    .values({
      id: randomUUID(),
      sourceTable: String(draft.sourceTable),
      sourceRowId: draft.sourceRowId,
      sourceUpdatedAt: draft.sourceUpdatedAt,
      chunkIndex: draft.chunkIndex,
      content: draft.content,
      contentHash: draft.contentHash,
      scope: draft.access.scope,
      ownerId: draft.access.ownerId,
      shopId: draft.access.shopId,
      participantUserIds: sql`ARRAY[]::text[]`,
      participantSellerIds: sql`ARRAY[]::text[]`,
      metadata: draft.metadata,
      embedding: sql`'[]'::jsonb`,
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((oc) =>
      oc.columns(["sourceTable", "sourceRowId", "chunkIndex"]).doUpdateSet({
        sourceUpdatedAt: draft.sourceUpdatedAt,
        content: draft.content,
        contentHash: draft.contentHash,
        scope: draft.access.scope,
        ownerId: draft.access.ownerId,
        shopId: draft.access.shopId,
        participantUserIds: sql`ARRAY[]::text[]`,
        participantSellerIds: sql`ARRAY[]::text[]`,
        metadata: draft.metadata,
        embedding: sql`'[]'::jsonb`,
        updatedAt: now,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()
    .catch((error) => {
      Logger.error(`#${vectorTable}.upsertDraft error: ${error}`)
      throw error
    })

  return {
    row,
    changed: true,
  }
}

export async function updateEmbedding(
  documentId: string,
  embedding: number[],
): Promise<void> {
  const normalized = _normalizeEmbedding(embedding)

  if (normalized.length === 0) {
    return
  }

  const now = new Date()
  const embeddingJson = JSON.stringify(normalized)

  await sql`
    update ai_vector_document
    set embedding = cast(${embeddingJson} as jsonb),
        "updatedAt" = ${now}
    where id = ${documentId}
  `
    .execute(db)
    .catch((e) => {
      Logger.error(`#${vectorTable}.updateEmbedding error: ${e}`)
      throw e
    })

  await _trySyncEmbeddingVector(documentId, normalized)
}

export async function listBySource(
  table: keyof Schema,
  sourceRowId: string,
): Promise<AIVectorDocumentRow[]> {
  return db
    .selectFrom(vectorTable)
    .selectAll()
    .where("sourceTable", "=", String(table))
    .where("sourceRowId", "=", sourceRowId)
    .orderBy("chunkIndex", "asc")
    .execute()
    .catch((e) => {
      Logger.error(`#${vectorTable}.listBySource error: ${e}`)
      throw e
    })
}

export async function removeBySource(
  table: keyof Schema,
  sourceRowId: string,
): Promise<void> {
  return db
    .deleteFrom(vectorTable)
    .where("sourceTable", "=", String(table))
    .where("sourceRowId", "=", sourceRowId)
    .execute()
    .then(() => undefined)
    .catch((e) => {
      Logger.error(`#${vectorTable}.removeBySource error: ${e}`)
      throw e
    })
}

export function filterRowsReadableByActor(
  actor: ActorContext,
  rows: AIVectorDocumentRow[],
): AIVectorDocumentRow[] {
  return rows.filter((row) => {
    return canActorReadVectorDocument(actor, {
      scope: row.scope,
      ownerId: row.ownerId,
      shopId: row.shopId,
    })
  })
}

export async function getCheckpoint(
  table: keyof Schema,
): Promise<AIIngestionCheckpointRow | null> {
  return db
    .selectFrom(checkpointTable)
    .selectAll()
    .where("tableName", "=", String(table))
    .executeTakeFirst()
    .then((row) => row ?? null)
    .catch((e) => {
      Logger.error(`#${checkpointTable}.getCheckpoint error: ${e}`)
      throw e
    })
}

export async function upsertCheckpoint(params: {
  table: keyof Schema
  lastSourceUpdatedAt: Date | null
}): Promise<void> {
  const now = new Date()

  return db
    .insertInto(checkpointTable)
    .values({
      tableName: String(params.table),
      lastSourceUpdatedAt: params.lastSourceUpdatedAt,
      lastRunAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((oc) =>
      oc.column("tableName").doUpdateSet({
        lastSourceUpdatedAt: params.lastSourceUpdatedAt,
        lastRunAt: now,
        updatedAt: now,
      }),
    )
    .execute()
    .then(() => undefined)
    .catch((e) => {
      Logger.error(`#${checkpointTable}.upsertCheckpoint error: ${e}`)
      throw e
    })
}

function _normalizeEmbedding(values: number[]): number[] {
  return values
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value))
}

async function _trySyncEmbeddingVector(
  documentId: string,
  embedding: number[],
): Promise<void> {
  const vectorReady = await _isVectorColumnReady()
  if (!vectorReady) {
    return
  }

  const vectorLiteral = _toVectorLiteral(embedding)

  await sql`
    update ai_vector_document
    set "embeddingVector" = cast(${vectorLiteral} as vector)
    where id = ${documentId}
  `
    .execute(db)
    .then(() => undefined)
    .catch((e) => {
      Logger.warn(`#${vectorTable}.syncEmbeddingVector skipped: ${e}`)
    })
}

async function _isVectorColumnReady(): Promise<boolean> {
  return sql<{ ready: boolean }>`
    select
      (
        to_regtype('vector') is not null
        and exists (
          select 1
          from information_schema.columns
          where table_name = 'ai_vector_document'
            and column_name = 'embeddingVector'
        )
      ) as ready
  `
    .execute(db)
    .then((result) => result.rows[0]?.ready === true)
    .catch(() => false)
}

function _toVectorLiteral(values: number[]): string {
  const safe = values
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value).toFixed(12))

  return `[${safe.join(",")}]`
}

function _isDraftUnchanged(
  row: AIVectorDocumentRow,
  draft: VectorDocumentDraft,
): boolean {
  if (row.contentHash !== draft.contentHash) {
    return false
  }

  if (row.scope !== draft.access.scope) {
    return false
  }

  if ((row.ownerId ?? null) !== (draft.access.ownerId ?? null)) {
    return false
  }

  if ((row.shopId ?? null) !== (draft.access.shopId ?? null)) {
    return false
  }

  if (row.sourceUpdatedAt.getTime() !== draft.sourceUpdatedAt.getTime()) {
    return false
  }

  return _stableStringify(row.metadata) === _stableStringify(draft.metadata)
}

function _stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => _stableStringify(entry)).join(",")}]`
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString())
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    return `{${entries
      .map(([key, entryValue]) => {
        return `${JSON.stringify(key)}:${_stableStringify(entryValue)}`
      })
      .join(",")}}`
  }

  return JSON.stringify(value)
}
