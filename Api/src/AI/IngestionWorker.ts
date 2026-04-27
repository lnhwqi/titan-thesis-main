import { sql } from "kysely"
import db from "../Database"
import type { Schema } from "../Database"
import * as Logger from "../Logger"
import * as ConversationRow from "../Database/ConversationRow"
import * as AIVectorDocumentRow from "../Database/AIVectorDocumentRow"
import { EmbeddingProvider } from "./Embedding"
import { buildVectorDocumentDraft } from "./IngestionContract"
import { getTablesEnabledForVectorIngestion } from "./SecurityPolicy"

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
  batchSize?: number
  tables?: Array<keyof Schema>
}): Promise<IngestionSummary> {
  const startedAt = new Date()
  const batchSize = Math.max(1, Math.min(params.batchSize ?? 200, 1000))
  const targetTables = params.tables ?? getTablesEnabledForVectorIngestion()
  const stats: IngestionTableStats[] = []

  for (const table of targetTables) {
    try {
      const tableStats = await _ingestTable({
        table,
        batchSize,
        embeddingProvider: params.embeddingProvider,
      })
      stats.push(tableStats)
    } catch (e) {
      Logger.error(`Vector ingestion failed for table ${String(table)}: ${e}`)
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
  batchSize: number
  embeddingProvider: EmbeddingProvider
}): Promise<IngestionTableStats> {
  const checkpoint = await AIVectorDocumentRow.getCheckpoint(params.table)
  const since = checkpoint?.lastSourceUpdatedAt ?? null

  const rows = await _fetchRowsSince(params.table, since, params.batchSize)

  const drafts: Array<{
    documentId: string
    content: string
    sourceUpdatedAt: Date
  }> = []
  let latestSourceUpdatedAt = since

  for (const row of rows) {
    const sourceRowId = _resolveSourceRowId(params.table, row)
    const sourceUpdatedAt = _resolveSourceUpdatedAt(params.table, row)

    if (sourceRowId == null || sourceUpdatedAt == null) {
      continue
    }

    const participants = await _resolveParticipants(params.table, row)

    const draft = buildVectorDocumentDraft({
      source: {
        table: params.table,
        rowId: sourceRowId,
        updatedAt: sourceUpdatedAt,
      },
      row,
      participants,
    })

    if (draft == null) {
      continue
    }

    const stored = await AIVectorDocumentRow.upsertDraft(draft)

    drafts.push({
      documentId: stored.id,
      content: draft.content,
      sourceUpdatedAt,
    })

    if (
      latestSourceUpdatedAt == null ||
      sourceUpdatedAt.getTime() > latestSourceUpdatedAt.getTime()
    ) {
      latestSourceUpdatedAt = sourceUpdatedAt
    }
  }

  if (drafts.length > 0) {
    const embeddings = await params.embeddingProvider.embed(
      drafts.map((draft) => draft.content),
    )

    const updates = Math.min(drafts.length, embeddings.length)
    for (let i = 0; i < updates; i += 1) {
      await AIVectorDocumentRow.updateEmbedding(
        drafts[i].documentId,
        embeddings[i],
      )
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
    draftedRows: drafts.length,
    embeddedRows: drafts.length,
  }
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

async function _resolveParticipants(
  table: keyof Schema,
  row: Record<string, unknown>,
): Promise<{ participantUserIds: string[]; participantSellerIds: string[] }> {
  if (table === "order_payment" || table === "report") {
    return {
      participantUserIds: _toArrayOfOne(_readString(row, "userId")),
      participantSellerIds: _toArrayOfOne(_readString(row, "sellerId")),
    }
  }

  if (table === "conversation") {
    return _participantsFromConversationRow(row)
  }

  if (table === "conversation_message") {
    const conversationId = _readString(row, "conversationId")
    if (conversationId == null) {
      return { participantUserIds: [], participantSellerIds: [] }
    }

    const conversation = await ConversationRow.findById(conversationId)
    if (conversation == null) {
      return { participantUserIds: [], participantSellerIds: [] }
    }

    return _participantsFromConversationRow({
      user1Id: conversation.user1Id,
      user1Type: conversation.user1Type,
      user2Id: conversation.user2Id,
      user2Type: conversation.user2Type,
    })
  }

  if (table === "order_payment_item") {
    const orderPaymentId = _readString(row, "orderPaymentId")
    if (orderPaymentId == null) {
      return { participantUserIds: [], participantSellerIds: [] }
    }

    const order = await db
      .selectFrom("order_payment")
      .select(["userId", "sellerId"])
      .where("id", "=", orderPaymentId)
      .where("isDeleted", "=", false)
      .executeTakeFirst()

    if (order == null) {
      return { participantUserIds: [], participantSellerIds: [] }
    }

    return {
      participantUserIds: _toArrayOfOne(order.userId),
      participantSellerIds: _toArrayOfOne(order.sellerId),
    }
  }

  return { participantUserIds: [], participantSellerIds: [] }
}

function _participantsFromConversationRow(row: Record<string, unknown>): {
  participantUserIds: string[]
  participantSellerIds: string[]
} {
  const userIds: string[] = []
  const sellerIds: string[] = []

  _pushParticipant(
    userIds,
    sellerIds,
    _readString(row, "user1Id"),
    _readString(row, "user1Type"),
  )
  _pushParticipant(
    userIds,
    sellerIds,
    _readString(row, "user2Id"),
    _readString(row, "user2Type"),
  )

  return {
    participantUserIds: _uniqueSorted(userIds),
    participantSellerIds: _uniqueSorted(sellerIds),
  }
}

function _pushParticipant(
  userIds: string[],
  sellerIds: string[],
  id: string | null,
  type: string | null,
): void {
  if (id == null || type == null) {
    return
  }

  if (type === "USER") {
    userIds.push(id)
    return
  }

  if (type === "SELLER") {
    sellerIds.push(id)
  }
}

function _toArrayOfOne(value: string | null): string[] {
  if (value == null || value.trim() === "") {
    return []
  }

  return [value]
}

function _uniqueSorted(values: string[]): string[] {
  const deduped = Array.from(
    new Set(values.filter((value) => value.trim() !== "")),
  )
  deduped.sort((a, b) => a.localeCompare(b))
  return deduped
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
