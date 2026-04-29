import {
  ActorContext,
  VectorDocumentMeta,
  VectorScope,
  canActorReadVectorDocument,
  getReadableScopesForActor,
} from "./SecurityPolicy"

export type VectorSearchActorFilter =
  | { role: "GUEST" }
  | { role: "USER"; ownerId: string }
  | { role: "SELLER"; shopId: string }
  | { role: "ADMIN" }

export type VectorSearchRequest = {
  queryEmbedding: number[]
  topK: number
  scopes?: VectorScope[]
  actorFilter?: VectorSearchActorFilter
}

export type VectorSearchResult = {
  documentId: string
  score: number
  content: string
  metadata: VectorDocumentMeta & {
    sourceTable: string
    sourceRowId: string
    sourceUpdatedAt: string
    chunkIndex: number
  }
}

export type VectorSearchProvider = {
  search: (request: VectorSearchRequest) => Promise<VectorSearchResult[]>
}

export type VectorUpsertParams = {
  id: string
  embedding: number[]
  content: string
  scope: VectorScope
  ownerId: string | null
  shopId: string | null
  sourceTable: string
  sourceRowId: string
  sourceUpdatedAt: Date
  chunkIndex: number
}

export type VectorStoreProvider = {
  upsert: (params: VectorUpsertParams) => Promise<void>
}

export async function searchWithPolicyFilter(params: {
  provider: VectorSearchProvider
  actor: ActorContext
  request: VectorSearchRequest
}): Promise<VectorSearchResult[]> {
  const actorScopes = getReadableScopesForActor(params.actor)
  const requestedScopes = params.request.scopes

  const scopes =
    requestedScopes == null
      ? actorScopes
      : requestedScopes.filter((scope) => actorScopes.includes(scope))

  if (scopes.length === 0) {
    return []
  }

  const safeRequest: VectorSearchRequest = {
    queryEmbedding: _normalizeEmbedding(params.request.queryEmbedding),
    topK: _sanitizeTopK(params.request.topK),
    scopes,
    actorFilter: _toActorFilter(params.actor),
  }

  const candidates = await params.provider.search(safeRequest)
  return filterReadableDocuments(params.actor, candidates)
}

export function filterReadableDocuments(
  actor: ActorContext,
  candidates: VectorSearchResult[],
): VectorSearchResult[] {
  return candidates.filter((candidate) => {
    return canActorReadVectorDocument(actor, {
      scope: candidate.metadata.scope,
      ownerId: candidate.metadata.ownerId,
      shopId: candidate.metadata.shopId,
    })
  })
}

function _toActorFilter(actor: ActorContext): VectorSearchActorFilter {
  if (actor.role === "USER") {
    return {
      role: "USER",
      ownerId: actor.userId,
    }
  }

  if (actor.role === "SELLER") {
    return {
      role: "SELLER",
      shopId: actor.sellerId,
    }
  }

  if (actor.role === "ADMIN") {
    return { role: "ADMIN" }
  }

  return { role: "GUEST" }
}

function _sanitizeTopK(topK: number): number {
  const rounded = Math.floor(topK)
  if (!Number.isFinite(rounded) || rounded < 1) {
    return 1
  }

  if (rounded > 50) {
    return 50
  }

  return rounded
}

function _normalizeEmbedding(embedding: number[]): number[] {
  return embedding
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value))
}
