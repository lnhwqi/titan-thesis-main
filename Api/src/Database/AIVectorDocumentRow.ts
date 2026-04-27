import { randomUUID } from "node:crypto"
import db, { Schema } from "../Database"
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
  participantUserIds: string[]
  participantSellerIds: string[]
  metadata: Record<string, unknown>
  embedding: unknown
  createdAt: Date
  updatedAt: Date
}

export type AIIngestionCheckpointRow = {
  tableName: string
  lastSourceUpdatedAt: Date | null
  lastRunAt: Date
  updatedAt: Date
  createdAt: Date
}

export async function upsertDraft(draft: VectorDocumentDraft): Promise<void> {
  const now = new Date()

  return db
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
      participantUserIds: draft.access.participantUserIds,
      participantSellerIds: draft.access.participantSellerIds,
      metadata: draft.metadata,
      embedding: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((oc) =>
      oc.columns(["sourceTable", "sourceRowId", "chunkIndex"]).doUpdateSet({
        sourceUpdatedAt: draft.sourceUpdatedAt,
        content: draft.content,
        contentHash: draft.contentHash,
        scope: draft.access.scope,
        participantUserIds: draft.access.participantUserIds,
        participantSellerIds: draft.access.participantSellerIds,
        metadata: draft.metadata,
        updatedAt: now,
      }),
    )
    .execute()
    .then(() => undefined)
    .catch((e) => {
      Logger.error(`#${vectorTable}.upsertDraft error: ${e}`)
      throw e
    })
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
      participantUserIds: row.participantUserIds,
      participantSellerIds: row.participantSellerIds,
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
