import {
  ActorContext,
  VectorDocumentMeta,
  VectorScope,
  canActorReadVectorDocument,
} from "./SecurityPolicy"

export type VectorSearchRequest = {
  queryEmbedding: number[]
  topK: number
  scopes?: VectorScope[]
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

export async function searchWithPolicyFilter(params: {
  provider: VectorSearchProvider
  actor: ActorContext
  request: VectorSearchRequest
}): Promise<VectorSearchResult[]> {
  const safeRequest: VectorSearchRequest = {
    queryEmbedding: _normalizeEmbedding(params.request.queryEmbedding),
    topK: _sanitizeTopK(params.request.topK),
    scopes: params.request.scopes,
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
      participantUserIds: candidate.metadata.participantUserIds,
      participantSellerIds: candidate.metadata.participantSellerIds,
    })
  })
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
