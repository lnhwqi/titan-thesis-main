import * as API from "../../../../../Core/Api/Auth/Admin/SupportAITraining"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import db from "../../../Database"
import * as Logger from "../../../Logger"
import { assertVectorDatabaseSecurity } from "../../../AI/Config"
import {
  DeterministicEmbeddingProvider,
  GeminiEmbeddingProvider,
} from "../../../AI/Embedding"
import { runVectorIngestionCycle } from "../../../AI/IngestionWorker"
import { createPineconeProviderFromEnv } from "../../../AI/PineconeVectorProvider"

export const contract = API.contract

let runningOperation: API.TrainingOperation | null = null

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (runningOperation != null) {
    return err("INGESTION_ALREADY_RUNNING")
  }

  runningOperation = params.operation

  try {
    assertVectorDatabaseSecurity()

    const pinecone = createPineconeProviderFromEnv()
    if (pinecone == null) {
      return err("PINECONE_NOT_CONFIGURED")
    }

    if (params.operation === "CLEAR") {
      const cleared = await clearVectorStore(pinecone)

      return ok({
        operation: "CLEAR",
        message: `Pinecone cleared. Removed ${cleared.vectorDocuments} cached vectors and ${cleared.checkpoints} checkpoints.`,
        cleared,
        ingestion: null,
      })
    }

    const summary = await runIngestion(pinecone)

    return ok({
      operation: "INGEST",
      message: `Training ingestion complete. Embedded ${summary.embeddedRows} chunks from ${summary.tables.length} table(s).`,
      cleared: null,
      ingestion: summary,
    })
  } catch (error) {
    Logger.error(
      `#admin.support-ai-training failed (${params.operation}): ${error}`,
    )
    return err("TRAINING_FAILED")
  } finally {
    runningOperation = null
  }
}

async function clearVectorStore(
  pinecone: NonNullable<ReturnType<typeof createPineconeProviderFromEnv>>,
): Promise<{ vectorDocuments: number; checkpoints: number }> {
  await pinecone.deleteAll()

  const vectorDeleted = await db
    .deleteFrom("ai_vector_document")
    .executeTakeFirst()

  const checkpointDeleted = await db
    .deleteFrom("ai_ingestion_checkpoint")
    .executeTakeFirst()

  return {
    vectorDocuments: normalizeDeletedCount(vectorDeleted?.numDeletedRows),
    checkpoints: normalizeDeletedCount(checkpointDeleted?.numDeletedRows),
  }
}

async function runIngestion(
  pinecone: NonNullable<ReturnType<typeof createPineconeProviderFromEnv>>,
): Promise<NonNullable<API.Payload["ingestion"]>> {
  const batchSize = Number(process.env.AI_INGEST_BATCH_SIZE ?? "200")
  const geminiApiKey = process.env.GEMINI_API_KEY ?? ""
  const geminiBaseURL = process.env.GEMINI_BASE_URL

  const embeddingProvider =
    geminiApiKey.trim() !== ""
      ? new GeminiEmbeddingProvider({
          apiKey: geminiApiKey,
          baseURL: geminiBaseURL,
        })
      : new DeterministicEmbeddingProvider({ dimension: 3072 })

  const summary = await runVectorIngestionCycle({
    embeddingProvider,
    vectorStore: pinecone,
    batchSize,
  })

  const totals = summary.stats.reduce(
    (acc, tableStat) => ({
      scannedRows: acc.scannedRows + tableStat.scannedRows,
      draftedRows: acc.draftedRows + tableStat.draftedRows,
      embeddedRows: acc.embeddedRows + tableStat.embeddedRows,
    }),
    {
      scannedRows: 0,
      draftedRows: 0,
      embeddedRows: 0,
    },
  )

  return {
    startedAt: summary.startedAt.toISOString(),
    finishedAt: summary.finishedAt.toISOString(),
    scannedRows: totals.scannedRows,
    draftedRows: totals.draftedRows,
    embeddedRows: totals.embeddedRows,
    tables: summary.stats.map((tableStat) => ({
      table: String(tableStat.table),
      scannedRows: tableStat.scannedRows,
      draftedRows: tableStat.draftedRows,
      embeddedRows: tableStat.embeddedRows,
    })),
  }
}

function normalizeDeletedCount(value: unknown): number {
  if (typeof value === "bigint") {
    return Number(value)
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  return 0
}
