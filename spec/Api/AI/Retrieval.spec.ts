import {
  VectorSearchProvider,
  searchWithPolicyFilter,
} from "../../../Api/src/AI/Retrieval"

describe("Api/AI/Retrieval", () => {
  test("filters out documents actor cannot read", async () => {
    const provider: VectorSearchProvider = {
      search: async () => {
        return [
          {
            documentId: "public-1",
            score: 0.01,
            content: "Public content",
            metadata: {
              scope: "PUBLIC",
              participantUserIds: [],
              participantSellerIds: [],
              sourceTable: "product",
              sourceRowId: "p-1",
              sourceUpdatedAt: "2026-04-27T00:00:00.000Z",
              chunkIndex: 0,
            },
          },
          {
            documentId: "private-1",
            score: 0.02,
            content: "Private content",
            metadata: {
              scope: "PARTICIPANT_PRIVATE",
              participantUserIds: ["u-1"],
              participantSellerIds: ["s-1"],
              sourceTable: "conversation_message",
              sourceRowId: "m-1",
              sourceUpdatedAt: "2026-04-27T00:00:00.000Z",
              chunkIndex: 0,
            },
          },
        ]
      },
    }

    const guestResults = await searchWithPolicyFilter({
      provider,
      actor: { role: "GUEST" },
      request: {
        queryEmbedding: [0.1, 0.2, 0.3],
        topK: 10,
      },
    })

    expect(guestResults.map((item) => item.documentId)).toEqual(["public-1"])
  })

  test("sanitizes invalid topK and embedding values before provider call", async () => {
    const calls: Array<{ topK: number; embeddingLength: number }> = []

    const provider: VectorSearchProvider = {
      search: async (request) => {
        calls.push({
          topK: request.topK,
          embeddingLength: request.queryEmbedding.length,
        })
        return []
      },
    }

    await searchWithPolicyFilter({
      provider,
      actor: { role: "GUEST" },
      request: {
        queryEmbedding: [1, Number.NaN, 2, Number.POSITIVE_INFINITY],
        topK: 0,
      },
    })

    expect(calls.length).toBe(1)
    expect(calls[0].topK).toBe(1)
    expect(calls[0].embeddingLength).toBe(2)
  })
})
