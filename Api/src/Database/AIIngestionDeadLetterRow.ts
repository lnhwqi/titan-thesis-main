import { randomUUID } from "node:crypto"
import db from "../Database"
import type { Schema } from "../Database"
import * as Logger from "../Logger"

const tableName = "ai_ingestion_dead_letter"

export async function recordFailure(params: {
  sourceTable: keyof Schema
  sourceRowId: string
  chunkIndex: number
  contentHash: string
  errorMessage: string
  payload: Record<string, unknown>
  retryCount: number
  nextRetryAt: Date | null
}): Promise<void> {
  const now = new Date()

  await db
    .insertInto(tableName)
    .values({
      id: randomUUID(),
      sourceTable: String(params.sourceTable),
      sourceRowId: params.sourceRowId,
      chunkIndex: params.chunkIndex,
      contentHash: params.contentHash,
      errorMessage: params.errorMessage,
      payload: params.payload,
      retryCount: params.retryCount,
      lastTriedAt: now,
      nextRetryAt: params.nextRetryAt,
      createdAt: now,
      updatedAt: now,
    })
    .execute()
    .then(() => undefined)
    .catch((error) => {
      Logger.error(`#${tableName}.recordFailure error: ${error}`)
      throw error
    })
}
