import {
  DeterministicEmbeddingProvider,
  GeminiEmbeddingProvider,
} from "./Embedding"
import { assertVectorDatabaseSecurity } from "./Config"
import { runVectorIngestionCycle } from "./IngestionWorker"
import { createPineconeProviderFromEnv } from "./PineconeVectorProvider"

async function main(): Promise<void> {
  assertVectorDatabaseSecurity()

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

  const vectorStore = createPineconeProviderFromEnv()

  if (vectorStore != null) {
    console.info("Using Pinecone as vector store.")
  }

  const summary = await runVectorIngestionCycle({
    embeddingProvider,
    vectorStore: vectorStore ?? undefined,
    batchSize,
  })

  console.info("AI ingestion completed", {
    startedAt: summary.startedAt.toISOString(),
    finishedAt: summary.finishedAt.toISOString(),
    stats: summary.stats,
  })
}

main().catch((error) => {
  console.error("AI ingestion failed", error)
  process.exit(1)
})
