import {
  type VectorSearchActorFilter,
  type VectorSearchProvider,
  type VectorSearchRequest,
  type VectorSearchResult,
  type VectorStoreProvider,
  type VectorUpsertParams,
} from "./Retrieval"
import { type VectorScope, normalizeVectorScope } from "./SecurityPolicy"

type PineconeMatch = {
  id: string
  score: number
  metadata?: Record<string, unknown>
}

export class PineconeVectorProvider
  implements VectorSearchProvider, VectorStoreProvider
{
  private apiKey: string
  private indexName: string
  private resolvedHost: string | null = null

  constructor(params: { apiKey: string; indexName: string }) {
    this.apiKey = params.apiKey
    this.indexName = params.indexName
  }

  async upsert(params: VectorUpsertParams): Promise<void> {
    const host = await this._resolveHost()

    const response = await fetch(`https://${host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        vectors: [
          {
            id: params.id,
            values: params.embedding,
            metadata: {
              content: params.content,
              scope: params.scope,
              ownerId: params.ownerId ?? "",
              shopId: params.shopId ?? "",
              sourceTable: params.sourceTable,
              sourceRowId: params.sourceRowId,
              sourceUpdatedAt: params.sourceUpdatedAt.toISOString(),
              chunkIndex: params.chunkIndex,
            },
          },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `Pinecone upsert failed with status ${response.status}: ${body}`,
      )
    }
  }

  async deleteAll(): Promise<void> {
    const host = await this._resolveHost()

    const response = await fetch(`https://${host}/vectors/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify({ deleteAll: true }),
    })

    if (response.status === 404) {
      // Namespace not found — index is already empty, nothing to delete
      return
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `Pinecone deleteAll failed with status ${response.status}: ${body}`,
      )
    }
  }

  async search(request: VectorSearchRequest): Promise<VectorSearchResult[]> {
    const host = await this._resolveHost()

    const filter = _buildFilter(
      request.actorFilter ?? { role: "GUEST" },
      request.scopes,
    )

    const response = await fetch(`https://${host}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        vector: request.queryEmbedding,
        topK: Math.max(1, Math.min(50, request.topK)),
        filter,
        includeMetadata: true,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `Pinecone query failed with status ${response.status}: ${body}`,
      )
    }

    const data = await response.json()
    const matches: PineconeMatch[] = data.matches ?? []

    return matches
      .filter((match) => typeof match.metadata?.content === "string")
      .map((match) => {
        const meta = match.metadata ?? {}
        const content = typeof meta.content === "string" ? meta.content : ""
        const scope = typeof meta.scope === "string" ? meta.scope : "PUBLIC"
        const ownerId = typeof meta.ownerId === "string" ? meta.ownerId : ""
        const shopId = typeof meta.shopId === "string" ? meta.shopId : ""
        const sourceTable =
          typeof meta.sourceTable === "string" ? meta.sourceTable : ""
        const sourceRowId =
          typeof meta.sourceRowId === "string" ? meta.sourceRowId : ""
        const sourceUpdatedAt =
          typeof meta.sourceUpdatedAt === "string" ? meta.sourceUpdatedAt : ""
        const chunkIndex = Number(meta.chunkIndex ?? 0)

        return {
          documentId: match.id,
          score: match.score,
          content,
          metadata: {
            scope: normalizeVectorScope(scope),
            ownerId: _emptyToNull(ownerId),
            shopId: _emptyToNull(shopId),
            sourceTable,
            sourceRowId,
            sourceUpdatedAt,
            chunkIndex,
          },
        }
      })
  }

  private async _resolveHost(): Promise<string> {
    if (this.resolvedHost != null) {
      return this.resolvedHost
    }

    const response = await fetch(
      `https://api.pinecone.io/indexes/${encodeURIComponent(this.indexName)}`,
      {
        headers: {
          "Api-Key": this.apiKey,
        },
      },
    )

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `Pinecone index lookup failed with status ${response.status}: ${body}`,
      )
    }

    const data = await response.json()
    const host: string = data.host

    if (typeof host !== "string" || host.trim() === "") {
      throw new Error(
        `Pinecone index "${this.indexName}" returned no host. Check the index name and API key.`,
      )
    }

    this.resolvedHost = host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    return this.resolvedHost
  }
}

export function createPineconeProviderFromEnv(): PineconeVectorProvider | null {
  const apiKey = process.env.PINECONE_API_KEY ?? ""
  const indexName = process.env.PINECONE_INDEX_NAME ?? ""

  if (apiKey.trim() === "" || indexName.trim() === "") {
    return null
  }

  return new PineconeVectorProvider({ apiKey, indexName })
}

function _buildFilter(
  actor: VectorSearchActorFilter,
  scopes: VectorScope[] | undefined,
): Record<string, unknown> {
  const allowedScopes: VectorScope[] = scopes ?? ["PUBLIC"]

  if (actor.role === "ADMIN") {
    return { scope: { $in: allowedScopes } }
  }

  const orClauses: Record<string, unknown>[] = []

  if (allowedScopes.includes("PUBLIC")) {
    orClauses.push({ scope: { $eq: "PUBLIC" } })
  }

  if (allowedScopes.includes("USER_PRIVATE") && actor.role === "USER") {
    orClauses.push({
      $and: [
        { scope: { $eq: "USER_PRIVATE" } },
        { ownerId: { $eq: actor.ownerId } },
      ],
    })
  }

  if (allowedScopes.includes("SELLER_PRIVATE") && actor.role === "SELLER") {
    orClauses.push({
      $and: [
        { scope: { $eq: "SELLER_PRIVATE" } },
        { shopId: { $eq: actor.shopId } },
      ],
    })
  }

  if (orClauses.length === 0) {
    return { scope: { $eq: "__no_match__" } }
  }

  if (orClauses.length === 1) {
    return orClauses[0]
  }

  return { $or: orClauses }
}

function _emptyToNull(value: string | undefined): string | null {
  if (value == null || value === "") return null
  return value
}
