import { sql } from "kysely"
import db from "../Database"
import type { Schema } from "../Database"
import * as Logger from "../Logger"
import * as AIVectorDocumentRow from "../Database/AIVectorDocumentRow"
import * as AIIngestionDeadLetterRow from "../Database/AIIngestionDeadLetterRow"
import { EmbeddingProvider } from "./Embedding"
import { type VectorStoreProvider } from "./Retrieval"
import {
  buildVectorDocumentDrafts,
  type VectorDocumentDraft,
} from "./IngestionContract"
import {
  getCurrentRagPhase,
  getTablesEnabledForVectorIngestion,
} from "./SecurityPolicy"

const EMBEDDING_BATCH_MAX = 1
const EMBEDDING_RETRY_ATTEMPTS = 5
const EMBEDDING_RETRY_BASE_MS = 300
const EMBEDDING_RATE_LIMIT_WAIT_MS = 65_000
const EMBEDDING_INTER_REQUEST_DELAY_MS = 700

export type IngestionTableStats = {
  table: keyof Schema
  scannedRows: number
  draftedRows: number
  embeddedRows: number
}

export type IngestionSummary = {
  startedAt: Date
  finishedAt: Date
  stats: IngestionTableStats[]
}

export async function runVectorIngestionCycle(params: {
  embeddingProvider: EmbeddingProvider
  vectorStore?: VectorStoreProvider
  batchSize?: number
  tables?: Array<keyof Schema>
}): Promise<IngestionSummary> {
  const startedAt = new Date()
  const batchSize = Math.max(1, Math.min(params.batchSize ?? 200, 1000))
  const phase = getCurrentRagPhase()
  const targetTables =
    params.tables ?? getTablesEnabledForVectorIngestion(phase)
  const stats: IngestionTableStats[] = []

  for (const table of targetTables) {
    try {
      const tableStats = await _ingestTable({
        table,
        phase,
        batchSize,
        embeddingProvider: params.embeddingProvider,
        vectorStore: params.vectorStore,
      })
      stats.push(tableStats)
    } catch (error) {
      if (error instanceof DailyQuotaExhaustedError) {
        throw error
      }
      Logger.error(
        `Vector ingestion failed for table ${String(table)}: ${error}`,
      )
      stats.push({
        table,
        scannedRows: 0,
        draftedRows: 0,
        embeddedRows: 0,
      })
    }
  }

  return {
    startedAt,
    finishedAt: new Date(),
    stats,
  }
}

async function _ingestTable(params: {
  table: keyof Schema
  phase: 1 | 2 | 3
  batchSize: number
  embeddingProvider: EmbeddingProvider
  vectorStore?: VectorStoreProvider
}): Promise<IngestionTableStats> {
  const checkpoint = await AIVectorDocumentRow.getCheckpoint(params.table)
  const since = checkpoint?.lastSourceUpdatedAt ?? null

  const rows = await _fetchRowsSince(params.table, since, params.batchSize)

  const pendingEmbeddings: Array<{
    documentId: string
    draft: VectorDocumentDraft
  }> = []
  let latestSourceUpdatedAt = since
  let draftedRows = 0

  for (const row of rows) {
    const sourceRowId = _resolveSourceRowId(params.table, row)
    const sourceUpdatedAt = _resolveSourceUpdatedAt(params.table, row)

    if (sourceRowId == null || sourceUpdatedAt == null) {
      continue
    }

    const drafts = buildVectorDocumentDrafts({
      source: {
        table: params.table,
        rowId: sourceRowId,
        updatedAt: sourceUpdatedAt,
      },
      row,
      phase: params.phase,
    })

    if (drafts.length === 0) {
      continue
    }

    draftedRows += drafts.length

    for (const draft of drafts) {
      const stored = await AIVectorDocumentRow.upsertDraft(draft)
      if (stored.changed) {
        pendingEmbeddings.push({
          documentId: stored.row.id,
          draft,
        })
      }
    }

    if (
      latestSourceUpdatedAt == null ||
      sourceUpdatedAt.getTime() > latestSourceUpdatedAt.getTime()
    ) {
      latestSourceUpdatedAt = sourceUpdatedAt
    }
  }

  let embeddedRows = 0
  let batchCount = 0
  const embeddingBatchSize = Math.min(EMBEDDING_BATCH_MAX, params.batchSize)

  for (const batch of _chunkArray(pendingEmbeddings, embeddingBatchSize)) {
    if (batchCount > 0) {
      await _wait(EMBEDDING_INTER_REQUEST_DELAY_MS)
    }
    batchCount += 1
    const texts = batch.map((item) => item.draft.content)
    const embeddings = await _embedWithRetry({
      provider: params.embeddingProvider,
      texts,
      maxAttempts: EMBEDDING_RETRY_ATTEMPTS,
    })

    if (embeddings == null) {
      await Promise.all(
        batch.map((item) =>
          _recordDeadLetter(params.table, item.draft, {
            errorMessage: "Embedding batch failed after retries",
            retryCount: EMBEDDING_RETRY_ATTEMPTS,
          }),
        ),
      )
      continue
    }

    for (let index = 0; index < batch.length; index += 1) {
      const item = batch[index]
      const embedding = embeddings[index]

      if (embedding == null || embedding.length === 0) {
        await _recordDeadLetter(params.table, item.draft, {
          errorMessage: "Embedding provider returned empty vector",
          retryCount: EMBEDDING_RETRY_ATTEMPTS,
        })
        continue
      }

      try {
        if (params.vectorStore != null) {
          await params.vectorStore.upsert({
            id: item.documentId,
            embedding,
            content: item.draft.content,
            scope: item.draft.access.scope,
            ownerId: item.draft.access.ownerId ?? null,
            shopId: item.draft.access.shopId ?? null,
            sourceTable: item.draft.sourceTable,
            sourceRowId: item.draft.sourceRowId,
            sourceUpdatedAt: item.draft.sourceUpdatedAt,
            chunkIndex: item.draft.chunkIndex,
          })
        } else {
          await AIVectorDocumentRow.updateEmbedding(item.documentId, embedding)
        }
        embeddedRows += 1
      } catch (error) {
        await _recordDeadLetter(params.table, item.draft, {
          errorMessage: `Embedding write failed: ${String(error)}`,
          retryCount: EMBEDDING_RETRY_ATTEMPTS,
        })
      }
    }
  }

  if (latestSourceUpdatedAt != null) {
    await AIVectorDocumentRow.upsertCheckpoint({
      table: params.table,
      lastSourceUpdatedAt: latestSourceUpdatedAt,
    })
  }

  return {
    table: params.table,
    scannedRows: rows.length,
    draftedRows,
    embeddedRows,
  }
}

class DailyQuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DailyQuotaExhaustedError"
  }
}

async function _embedWithRetry(params: {
  provider: EmbeddingProvider
  texts: string[]
  maxAttempts: number
}): Promise<number[][] | null> {
  for (let attempt = 1; attempt <= params.maxAttempts; attempt += 1) {
    try {
      return await params.provider.embed(params.texts)
    } catch (error) {
      const errorStr = String(error)

      if (errorStr.includes("429")) {
        if (_isDailyQuotaExhausted(errorStr)) {
          throw new DailyQuotaExhaustedError(
            "Daily embedding quota exhausted. Re-run ai:ingest tomorrow when the quota resets.",
          )
        }

        if (attempt >= params.maxAttempts) {
          Logger.error(`Embedding failed after retries: ${error}`)
          return null
        }

        const delay =
          _parseRetryDelayMs(errorStr) ?? EMBEDDING_RATE_LIMIT_WAIT_MS
        Logger.warn(
          `Rate limited by embedding API (attempt ${attempt}/${params.maxAttempts}), waiting ${Math.round(delay / 1000)}s...`,
        )
        await _wait(delay)
      } else {
        if (attempt >= params.maxAttempts) {
          Logger.error(`Embedding failed after retries: ${error}`)
          return null
        }
        await _wait(EMBEDDING_RETRY_BASE_MS * 2 ** (attempt - 1))
      }
    }
  }

  return null
}

function _isDailyQuotaExhausted(errorMessage: string): boolean {
  return errorMessage.includes("PerDay")
}

function _parseRetryDelayMs(errorMessage: string): number | null {
  const match = errorMessage.match(/"retryDelay":\s*"(\d+)s"/)
  if (match == null) {
    return null
  }
  const seconds = Number(match[1])
  return Number.isFinite(seconds) ? (seconds + 5) * 1000 : null
}

async function _recordDeadLetter(
  table: keyof Schema,
  draft: VectorDocumentDraft,
  params: {
    errorMessage: string
    retryCount: number
  },
): Promise<void> {
  const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000)

  await AIIngestionDeadLetterRow.recordFailure({
    sourceTable: table,
    sourceRowId: draft.sourceRowId,
    chunkIndex: draft.chunkIndex,
    contentHash: draft.contentHash,
    errorMessage: params.errorMessage,
    payload: {
      scope: draft.access.scope,
      ownerId: draft.access.ownerId,
      shopId: draft.access.shopId,
      metadata: draft.metadata,
    },
    retryCount: params.retryCount,
    nextRetryAt,
  })
}

async function _fetchRowsSince(
  table: keyof Schema,
  since: Date | null,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const tableExists = await _tableExists(table)
  if (!tableExists) {
    Logger.warn(`Vector ingestion skipped missing table: ${String(table)}`)
    return []
  }

  const timestampColumn = _timestampColumn(table)
  const softDelete = _hasSoftDelete(table)

  if (since == null && softDelete) {
    return sql<Record<string, unknown>>`
      select *
      from ${sql.id(String(table))}
      where "isDeleted" = false
      order by ${sql.id(timestampColumn)} asc
      limit ${limit}
    `
      .execute(db)
      .then((result) => result.rows)
  }

  if (since == null) {
    return sql<Record<string, unknown>>`
      select *
      from ${sql.id(String(table))}
      order by ${sql.id(timestampColumn)} asc
      limit ${limit}
    `
      .execute(db)
      .then((result) => result.rows)
  }

  if (softDelete) {
    return sql<Record<string, unknown>>`
      select *
      from ${sql.id(String(table))}
      where "isDeleted" = false
        and ${sql.id(timestampColumn)} > ${since}
      order by ${sql.id(timestampColumn)} asc
      limit ${limit}
    `
      .execute(db)
      .then((result) => result.rows)
  }

  return sql<Record<string, unknown>>`
    select *
    from ${sql.id(String(table))}
    where ${sql.id(timestampColumn)} > ${since}
    order by ${sql.id(timestampColumn)} asc
    limit ${limit}
  `
    .execute(db)
    .then((result) => result.rows)
}

function _timestampColumn(table: keyof Schema): string {
  switch (table) {
    case "conversation_message":
      return "createdAt"
    default:
      return "updatedAt"
  }
}

function _hasSoftDelete(table: keyof Schema): boolean {
  switch (table) {
    case "category":
    case "product":
    case "productImage":
    case "product_variant":
    case "seller":
    case "poster":
    case "product_rating":
    case "order_payment":
    case "report":
    case "product_rating_report":
    case "voucher":
      return true
    default:
      return false
  }
}

function _resolveSourceUpdatedAt(
  table: keyof Schema,
  row: Record<string, unknown>,
): Date | null {
  const timestampColumn = _timestampColumn(table)
  return _toDate(row[timestampColumn])
}

function _resolveSourceRowId(
  table: keyof Schema,
  row: Record<string, unknown>,
): string | null {
  if (table === "product_rating") {
    const orderId = _readString(row, "orderId")
    const productId = _readString(row, "productId")
    const userId = _readString(row, "userId")

    if (orderId == null || productId == null || userId == null) {
      return null
    }

    return `${orderId}:${productId}:${userId}`
  }

  return _readString(row, "id")
}

function _chunkArray<T>(value: T[], size: number): T[][] {
  if (size <= 0 || value.length === 0) {
    return value.length === 0 ? [] : [value]
  }

  const chunks: T[][] = []

  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size))
  }

  return chunks
}

function _readString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === "string" ? value : null
}

function _toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

async function _tableExists(table: keyof Schema): Promise<boolean> {
  return sql<{ exists: boolean }>`
    select exists(
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = ${String(table)}
    ) as exists
  `
    .execute(db)
    .then((result) => result.rows[0]?.exists === true)
    .catch(() => false)
}

async function _wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}
