import { DeterministicEmbeddingProvider, GeminiEmbeddingProvider } from "./Embedding"
import { runVectorIngestionCycle } from "./IngestionWorker"

async function main(): Promise<void> {
  const batchSize = Number(process.env.AI_INGEST_BATCH_SIZE ?? "200")
  const geminiApiKey = process.env.GEMINI_API_KEY ?? ""

  const embeddingProvider =
    geminiApiKey.trim() !== ""
      ? new GeminiEmbeddingProvider({ apiKey: geminiApiKey })
      : new DeterministicEmbeddingProvider({ dimension: 768 })

  const summary = await runVectorIngestionCycle({
    embeddingProvider,
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
