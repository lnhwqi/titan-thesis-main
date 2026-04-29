import { createHash } from "node:crypto"
import {
  DeterministicEmbeddingProvider,
  GeminiEmbeddingProvider,
} from "./Embedding"
import { assertVectorDatabaseSecurity } from "./Config"
import { createPineconeProviderFromEnv } from "./PineconeVectorProvider"
import { FAQ_ITEMS } from "./FaqIngestion"

const INTER_REQUEST_DELAY_MS = 700

async function main(): Promise<void> {
  assertVectorDatabaseSecurity()

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

  if (vectorStore == null) {
    console.error(
      "No vector store configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME.",
    )
    process.exit(1)
  }

  console.info(`Ingesting ${FAQ_ITEMS.length} FAQ items into Pinecone…`)

  let upserted = 0

  for (let index = 0; index < FAQ_ITEMS.length; index += 1) {
    const item = FAQ_ITEMS[index]

    if (index > 0) {
      await _wait(INTER_REQUEST_DELAY_MS)
    }

    const embeddings = await embeddingProvider.embed([item.content])
    const embedding = embeddings[0]

    if (embedding == null || embedding.length === 0) {
      console.warn(`Skipping FAQ item "${item.slug}" — empty embedding`)
      continue
    }

    const documentId = _stableId(item.slug)

    await vectorStore.upsert({
      id: documentId,
      embedding,
      content: item.content,
      scope: "PUBLIC",
      ownerId: null,
      shopId: null,
      sourceTable: "platform_faq",
      sourceRowId: item.slug,
      sourceUpdatedAt: new Date("2025-01-01T00:00:00Z"),
      chunkIndex: 0,
    })

    upserted += 1
    console.info(`  [${index + 1}/${FAQ_ITEMS.length}] ${item.slug}`)
  }

  console.info(`FAQ ingestion completed. Upserted ${upserted} documents.`)
}

function _stableId(slug: string): string {
  return createHash("sha256").update(`platform_faq:${slug}`).digest("hex")
}

async function _wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error("FAQ ingestion failed", error)
  process.exit(1)
})
