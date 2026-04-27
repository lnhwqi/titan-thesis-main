import {
  DeterministicEmbeddingProvider,
  normalizeEmbeddingDimension,
} from "../../../Api/src/AI/Embedding"

describe("Api/AI/Embedding", () => {
  test("deterministic provider returns stable vectors", async () => {
    const provider = new DeterministicEmbeddingProvider({ dimension: 8 })

    const [a] = await provider.embed(["hello world"])
    const [b] = await provider.embed(["hello world"])
    const [c] = await provider.embed(["another text"])

    expect(a.length).toBe(8)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  test("normalizeEmbeddingDimension pads and trims to target dimension", () => {
    const padded = normalizeEmbeddingDimension([1, 2], 5)
    const trimmed = normalizeEmbeddingDimension([1, 2, 3, 4, 5], 3)

    expect(padded.length).toBe(5)
    expect(trimmed.length).toBe(3)
  })
})
