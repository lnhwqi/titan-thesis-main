import db from "../Database"
import { createPineconeProviderFromEnv } from "./PineconeVectorProvider"

async function main(): Promise<void> {
  const pinecone = createPineconeProviderFromEnv()

  if (pinecone != null) {
    console.info("Deleting all vectors from Pinecone index...")
    await pinecone.deleteAll()
    console.info("Pinecone index cleared.")
  }

  await db.deleteFrom("ai_vector_document").execute()
  await db.deleteFrom("ai_ingestion_checkpoint").execute()
  console.info("AI vector store reset: all documents and checkpoints cleared.")
}

main().catch((error) => {
  console.error("Reset failed", error)
  process.exit(1)
})
