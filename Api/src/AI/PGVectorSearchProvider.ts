import { sql } from "kysely"
import db from "../Database"
import {
  VectorSearchProvider,
  VectorSearchRequest,
  VectorSearchResult,
} from "./Retrieval"
import { VectorScope } from "./SecurityPolicy"

type VectorRow = {
  id: string
  content: string
  scope: VectorScope
  participantUserIds: unknown
  participantSellerIds: unknown
  sourceTable: string
  sourceRowId: string
  sourceUpdatedAt: Date | string
  chunkIndex: number
  distance: number
}

type FallbackRow = {
  id: string
  content: string
  scope: VectorScope
  participantUserIds: unknown
  participantSellerIds: unknown
  sourceTable: string
  sourceRowId: string
  sourceUpdatedAt: Date | string
  chunkIndex: number
  embedding: unknown
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

    const canUseVector = await this._isVectorReady()

    if (canUseVector) {
      try {
        return await this._searchWithVector(embedding, topK, request.scopes)
      } catch {
        this.vectorReady = false
      }
    }

    return this._searchWithFallback(embedding, topK, request.scopes)
  }

  private async _searchWithVector(
    embedding: number[],
    topK: number,
    scopes: VectorScope[] | undefined,
  ): Promise<VectorSearchResult[]> {
    const vectorLiteral = _toVectorLiteral(embedding)

    const result =
      scopes == null || scopes.length === 0
        ? await sql<VectorRow>`
          select
            id,
            content,
            scope,
            "participantUserIds",
            "participantSellerIds",
            "sourceTable",
            "sourceRowId",
            "sourceUpdatedAt",
            "chunkIndex",
            ("embeddingVector" <=> cast(${vectorLiteral} as vector)) as distance
          from ai_vector_document
          where "embeddingVector" is not null
          order by "embeddingVector" <=> cast(${vectorLiteral} as vector) asc
          limit ${topK}
        `.execute(db)
        : scopes.length === 1
          ? await sql<VectorRow>`
            select
              id,
              content,
              scope,
              "participantUserIds",
              "participantSellerIds",
              "sourceTable",
              "sourceRowId",
              "sourceUpdatedAt",
              "chunkIndex",
              ("embeddingVector" <=> cast(${vectorLiteral} as vector)) as distance
            from ai_vector_document
            where "embeddingVector" is not null
              and scope = ${scopes[0]}
            order by "embeddingVector" <=> cast(${vectorLiteral} as vector) asc
            limit ${topK}
          `.execute(db)
          : await sql<VectorRow>`
            select
              id,
              content,
              scope,
              "participantUserIds",
              "participantSellerIds",
              "sourceTable",
              "sourceRowId",
              "sourceUpdatedAt",
              "chunkIndex",
              ("embeddingVector" <=> cast(${vectorLiteral} as vector)) as distance
            from ai_vector_document
            where "embeddingVector" is not null
              and scope in (${sql.join(
                scopes.map((scope) => sql`${scope}`),
                sql`, `,
              )})
            order by "embeddingVector" <=> cast(${vectorLiteral} as vector) asc
            limit ${topK}
          `.execute(db)

    return result.rows.map((row) => ({
      documentId: row.id,
      score: 1 - Number(row.distance),
      content: row.content,
      metadata: {
        scope: row.scope,
        participantUserIds: _toStringArray(row.participantUserIds),
        participantSellerIds: _toStringArray(row.participantSellerIds),
        sourceTable: row.sourceTable,
        sourceRowId: row.sourceRowId,
        sourceUpdatedAt: _toISOString(row.sourceUpdatedAt),
        chunkIndex: Number(row.chunkIndex),
      },
    }))
  }

  private async _searchWithFallback(
    embedding: number[],
    topK: number,
    scopes: VectorScope[] | undefined,
  ): Promise<VectorSearchResult[]> {
    const scanLimit = Math.max(topK * 20, this.fallbackScanLimit)

    const result =
      scopes == null || scopes.length === 0
        ? await sql<FallbackRow>`
          select
            id,
            content,
            scope,
            "participantUserIds",
            "participantSellerIds",
            "sourceTable",
            "sourceRowId",
            "sourceUpdatedAt",
            "chunkIndex",
            embedding
          from ai_vector_document
          where jsonb_typeof(embedding) = 'array'
            and jsonb_array_length(embedding) > 0
          order by "updatedAt" desc
          limit ${scanLimit}
        `.execute(db)
        : scopes.length === 1
          ? await sql<FallbackRow>`
            select
              id,
              content,
              scope,
              "participantUserIds",
              "participantSellerIds",
              "sourceTable",
              "sourceRowId",
              "sourceUpdatedAt",
              "chunkIndex",
              embedding
            from ai_vector_document
            where jsonb_typeof(embedding) = 'array'
              and jsonb_array_length(embedding) > 0
              and scope = ${scopes[0]}
            order by "updatedAt" desc
            limit ${scanLimit}
          `.execute(db)
          : await sql<FallbackRow>`
            select
              id,
              content,
              scope,
              "participantUserIds",
              "participantSellerIds",
              "sourceTable",
              "sourceRowId",
              "sourceUpdatedAt",
              "chunkIndex",
              embedding
            from ai_vector_document
            where jsonb_typeof(embedding) = 'array'
              and jsonb_array_length(embedding) > 0
              and scope in (${sql.join(
                scopes.map((scope) => sql`${scope}`),
                sql`, `,
              )})
            order by "updatedAt" desc
            limit ${scanLimit}
          `.execute(db)

    const ranked = result.rows
      .map((row) => {
        const docEmbedding = _toNumberArray(row.embedding)
        const distance = _cosineDistance(embedding, docEmbedding)

        return {
          row,
          distance,
        }
      })
      .filter((entry) => Number.isFinite(entry.distance))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, topK)

    return ranked.map((entry) => ({
      documentId: entry.row.id,
      score: 1 - entry.distance,
      content: entry.row.content,
      metadata: {
        scope: entry.row.scope,
        participantUserIds: _toStringArray(entry.row.participantUserIds),
        participantSellerIds: _toStringArray(entry.row.participantSellerIds),
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

function _toVectorLiteral(values: number[]): string {
  const safeValues = values
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value).toFixed(12))

  return `[${safeValues.join(",")}]`
}

function _toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string")
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        return Array.isArray(parsed)
          ? parsed.filter((entry) => typeof entry === "string")
          : []
      } catch {
        return []
      }
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const values = trimmed.slice(1, trimmed.length - 1)
      if (values === "") {
        return []
      }

      return values
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry !== "")
    }
  }

  return []
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
