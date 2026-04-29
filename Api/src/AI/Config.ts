export type VectorDatabaseStrategy = "pgvector" | "external"

export function getVectorDatabaseStrategy(): VectorDatabaseStrategy {
  const raw = (process.env.AI_VECTOR_DB_STRATEGY ?? "pgvector")
    .trim()
    .toLowerCase()

  if (raw === "external") {
    return "external"
  }

  return "pgvector"
}

export function assertVectorDatabaseSecurity(): void {
  const strategy = getVectorDatabaseStrategy()

  if (strategy !== "external") {
    return
  }

  const privateNetwork =
    (process.env.AI_VECTOR_EXTERNAL_PRIVATE_NETWORK ?? "").trim() === "true"
  const authMode = (process.env.AI_VECTOR_EXTERNAL_AUTH_MODE ?? "")
    .trim()
    .toLowerCase()

  if (!privateNetwork) {
    throw new Error(
      "AI_VECTOR_EXTERNAL_PRIVATE_NETWORK=true is required for external vector DB.",
    )
  }

  if (authMode !== "service-to-service") {
    throw new Error(
      "AI_VECTOR_EXTERNAL_AUTH_MODE=service-to-service is required for external vector DB.",
    )
  }
}
