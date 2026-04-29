import { sql } from "kysely"
import db from "../Database"
import {
  type VectorSearchActorFilter,
  type VectorSearchProvider,
  type VectorSearchRequest,
  type VectorSearchResult,
} from "./Retrieval"
import { type VectorScope, normalizeVectorScope } from "./SecurityPolicy"

type VectorRow = {
  id: string
  content: string
  scope: string
  ownerId: string | null
  shopId: string | null
  sourceTable: string
  sourceRowId: string
  sourceUpdatedAt: Date | string
  chunkIndex: number
  distance: number
}

type FallbackRow = {
  id: string
  content: string
  scope: string
  ownerId: string | null
  shopId: string | null
  sourceTable: string
  sourceRowId: string
  sourceUpdatedAt: Date | string
  chunkIndex: number
  embedding: unknown
}

type ScopeFlags = {
  includePublic: boolean
  includeUserPrivate: boolean
  includeSellerPrivate: boolean
  includeAdminPrivate: boolean
}

export class PGVectorSearchProvider implements VectorSearchProvider {
  private vectorReady: boolean | null = null
  private fallbackScanLimit: number

  constructor(params?: { fallbackScanLimit?: number }) {
    this.fallbackScanLimit = Math.max(50, params?.fallbackScanLimit ?? 500)
  }

  async search(request: VectorSearchRequest): Promise<VectorSearchResult[]> {
    const topK = Math.max(1, Math.min(50, request.topK))
    const embedding = request.queryEmbedding
      .filter((value) => Number.isFinite(value))
      .map((value) => Number(value))

    if (embedding.length === 0) {
      return []
    }

    const actorFilter = request.actorFilter ?? _guestActorFilter()
    const scopeFlags = _buildScopeFlags(request.scopes)

    const canUseVector = await this._isVectorReady()

    if (canUseVector) {
      try {
        return await this._searchWithVector({
          embedding,
          topK,
          actorFilter,
          scopeFlags,
        })
      } catch {
        this.vectorReady = false
      }
    }

    return this._searchWithFallback({
      embedding,
      topK,
      actorFilter,
      scopeFlags,
    })
  }

  private async _searchWithVector(params: {
    embedding: number[]
    topK: number
    actorFilter: VectorSearchActorFilter
    scopeFlags: ScopeFlags
  }): Promise<VectorSearchResult[]> {
    const vectorLiteral = _toVectorLiteral(params.embedding)
    const actorPredicate = _toActorPredicate(
      params.actorFilter,
      params.scopeFlags,
    )

    const result = await sql<VectorRow>`
      select
        id,
        content,
        scope,
        "ownerId",
        "shopId",
        "sourceTable",
        "sourceRowId",
        "sourceUpdatedAt",
        "chunkIndex",
        ("embeddingVector" <=> cast(${vectorLiteral} as vector)) as distance
      from ai_vector_document
      where "embeddingVector" is not null
        and ${actorPredicate}
      order by "embeddingVector" <=> cast(${vectorLiteral} as vector) asc
      limit ${params.topK}
    `.execute(db)

    return result.rows.map((row) => ({
      documentId: row.id,
      score: 1 - Number(row.distance),
      content: row.content,
      metadata: {
        scope: normalizeVectorScope(row.scope),
        ownerId: _toNullableString(row.ownerId),
        shopId: _toNullableString(row.shopId),
        sourceTable: row.sourceTable,
        sourceRowId: row.sourceRowId,
        sourceUpdatedAt: _toISOString(row.sourceUpdatedAt),
        chunkIndex: Number(row.chunkIndex),
      },
    }))
  }

  private async _searchWithFallback(params: {
    embedding: number[]
    topK: number
    actorFilter: VectorSearchActorFilter
    scopeFlags: ScopeFlags
  }): Promise<VectorSearchResult[]> {
    const scanLimit = Math.max(params.topK * 20, this.fallbackScanLimit)
    const actorPredicate = _toActorPredicate(
      params.actorFilter,
      params.scopeFlags,
    )

    const result = await sql<FallbackRow>`
      select
        id,
        content,
        scope,
        "ownerId",
        "shopId",
        "sourceTable",
        "sourceRowId",
        "sourceUpdatedAt",
        "chunkIndex",
        embedding
      from ai_vector_document
      where jsonb_typeof(embedding) = 'array'
        and jsonb_array_length(embedding) > 0
        and ${actorPredicate}
      order by "updatedAt" desc
      limit ${scanLimit}
    `.execute(db)

    const ranked = result.rows
      .map((row) => {
        const docEmbedding = _toNumberArray(row.embedding)
        const distance = _cosineDistance(params.embedding, docEmbedding)

        return {
          row,
          distance,
        }
      })
      .filter((entry) => Number.isFinite(entry.distance))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, params.topK)

    return ranked.map((entry) => ({
      documentId: entry.row.id,
      score: 1 - entry.distance,
      content: entry.row.content,
      metadata: {
        scope: normalizeVectorScope(entry.row.scope),
        ownerId: _toNullableString(entry.row.ownerId),
        shopId: _toNullableString(entry.row.shopId),
        sourceTable: entry.row.sourceTable,
        sourceRowId: entry.row.sourceRowId,
        sourceUpdatedAt: _toISOString(entry.row.sourceUpdatedAt),
        chunkIndex: Number(entry.row.chunkIndex),
      },
    }))
  }

  private async _isVectorReady(): Promise<boolean> {
    if (this.vectorReady != null) {
      return this.vectorReady
    }

    this.vectorReady = await sql<{ ready: boolean }>`
      select
        (
          to_regtype('vector') is not null
          and exists (
            select 1
            from information_schema.columns
            where table_name = 'ai_vector_document'
              and column_name = 'embeddingVector'
          )
        ) as ready
    `
      .execute(db)
      .then((result) => result.rows[0]?.ready === true)
      .catch(() => false)

    return this.vectorReady
  }
}

function _guestActorFilter(): VectorSearchActorFilter {
  return { role: "GUEST" }
}

function _buildScopeFlags(scopes: VectorScope[] | undefined): ScopeFlags {
  const uniqueScopes = Array.from(new Set(scopes ?? ["PUBLIC"]))

  return {
    includePublic: uniqueScopes.includes("PUBLIC"),
    includeUserPrivate: uniqueScopes.includes("USER_PRIVATE"),
    includeSellerPrivate: uniqueScopes.includes("SELLER_PRIVATE"),
    includeAdminPrivate: uniqueScopes.includes("ADMIN_PRIVATE"),
  }
}

function _toActorPredicate(
  actor: VectorSearchActorFilter,
  flags: ScopeFlags,
): ReturnType<typeof sql<boolean>> {
  if (actor.role === "USER") {
    return sql<boolean>`
      (
        (${flags.includePublic} and scope = 'PUBLIC')
        or (
          ${flags.includeUserPrivate}
          and scope = 'USER_PRIVATE'
          and "ownerId" = ${actor.ownerId}
        )
      )
    `
  }

  if (actor.role === "SELLER") {
    return sql<boolean>`
      (
        (${flags.includePublic} and scope = 'PUBLIC')
        or (
          ${flags.includeSellerPrivate}
          and scope = 'SELLER_PRIVATE'
          and "shopId" = ${actor.shopId}
        )
      )
    `
  }

  if (actor.role === "ADMIN") {
    return sql<boolean>`
      (
        (${flags.includePublic} and scope = 'PUBLIC')
        or (${flags.includeAdminPrivate} and scope = 'ADMIN_PRIVATE')
      )
    `
  }

  return sql<boolean>`(${flags.includePublic} and scope = 'PUBLIC')`
}

function _toVectorLiteral(values: number[]): string {
  const safeValues = values
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value).toFixed(12))

  return `[${safeValues.join(",")}]`
}

function _toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function _toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => typeof entry === "number")
      .map((entry) => Number(entry))
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((entry) => typeof entry === "number")
        : []
    } catch {
      return []
    }
  }

  return []
}

function _toISOString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString()
  }

  return parsed.toISOString()
}

function _cosineDistance(a: number[], b: number[]): number {
  const dimensions = Math.min(a.length, b.length)
  if (dimensions === 0) {
    return Number.POSITIVE_INFINITY
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < dimensions; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) {
    return Number.POSITIVE_INFINITY
  }

  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB))
  return 1 - similarity
}
