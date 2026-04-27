import { createHash } from "node:crypto"

export type EmbeddingProvider = {
  model: string
  dimension: number
  embed: (texts: string[]) => Promise<number[][]>
}

export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  model: string
  dimension: number

  constructor(params?: { model?: string; dimension?: number }) {
    this.model = params?.model ?? "deterministic-v1"
    this.dimension = Math.max(1, params?.dimension ?? 768)
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => _deterministicEmbedding(text, this.dimension))
  }
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  model: string
  dimension: number
  private apiKey: string

  constructor(params: { apiKey: string; model?: string; dimension?: number }) {
    this.apiKey = params.apiKey
    this.model = params.model ?? "text-embedding-004"
    this.dimension = Math.max(1, params.dimension ?? 768)
  }

  async embed(texts: string[]): Promise<number[][]> {
    const cleaned = texts.map((text) => text.trim()).filter((text) => text !== "")
    if (cleaned.length === 0) {
      return []
    }

    return Promise.all(cleaned.map((text) => this._embedOne(text)))
  }

  private async _embedOne(text: string): Promise<number[]> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${encodeURIComponent(this.apiKey)}`

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${this.model}`,
        content: {
          parts: [{ text }],
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed with status ${response.status}`)
    }

    const data = await response.json()
    const values = _extractEmbeddingValues(data)

    return normalizeEmbeddingDimension(values, this.dimension)
  }
}

export function normalizeEmbeddingDimension(
  values: number[],
  dimension: number,
): number[] {
  const normalized = values
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value))

  if (normalized.length === 0) {
    return _emptyVector(dimension)
  }

  if (normalized.length > dimension) {
    return _l2Normalize(normalized.slice(0, dimension))
  }

  if (normalized.length < dimension) {
    const padded = [...normalized]
    while (padded.length < dimension) {
      padded.push(0)
    }
    return _l2Normalize(padded)
  }

  return _l2Normalize(normalized)
}

function _extractEmbeddingValues(value: unknown): number[] {
  if (typeof value !== "object" || value === null) {
    throw new Error("Unexpected embedding response shape")
  }

  if (!("embedding" in value)) {
    throw new Error("Missing embedding field")
  }

  const embedding = value.embedding
  if (typeof embedding !== "object" || embedding === null) {
    throw new Error("Invalid embedding field")
  }

  if (!("values" in embedding)) {
    throw new Error("Missing embedding values field")
  }

  const values = embedding.values
  if (!Array.isArray(values)) {
    throw new Error("Invalid embedding values")
  }

  return values
    .filter((entry) => typeof entry === "number")
    .map((entry) => Number(entry))
}

function _deterministicEmbedding(text: string, dimension: number): number[] {
  const digest = createHash("sha256").update(text).digest()
  const values: number[] = []

  for (let i = 0; i < dimension; i += 1) {
    const byte = digest[i % digest.length]
    const centered = byte / 127.5 - 1
    values.push(centered)
  }

  return _l2Normalize(values)
}

function _l2Normalize(values: number[]): number[] {
  const squareSum = values.reduce((acc, value) => acc + value * value, 0)
  const norm = Math.sqrt(squareSum)

  if (norm === 0) {
    return values
  }

  return values.map((value) => value / norm)
}

function _emptyVector(dimension: number): number[] {
  const vector: number[] = []
  for (let i = 0; i < dimension; i += 1) {
    vector.push(0)
  }
  return vector
}
