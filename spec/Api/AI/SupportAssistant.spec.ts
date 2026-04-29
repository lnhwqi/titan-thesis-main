import { TemplateAnswerGenerator } from "../../../Api/src/AI/Answer"
import { EmbeddingProvider } from "../../../Api/src/AI/Embedding"
import { answerSupportQuestion } from "../../../Api/src/AI/SupportAssistant"
import { VectorSearchProvider } from "../../../Api/src/AI/Retrieval"

describe("Api/AI/SupportAssistant", () => {
  test("returns policy-filtered contexts and citations", async () => {
    const embeddingProvider: EmbeddingProvider = {
      model: "mock-embed",
      dimension: 3,
      embed: async () => [[0.1, 0.2, 0.3]],
    }

    const searchProvider: VectorSearchProvider = {
      search: async () => [
        {
          documentId: "public-1",
          score: 0.9,
          content: "Public FAQ",
          metadata: {
            scope: "PUBLIC",
            ownerId: null,
            shopId: null,
            sourceTable: "product",
            sourceRowId: "p-1",
            sourceUpdatedAt: "2026-04-28T00:00:00.000Z",
            chunkIndex: 0,
          },
        },
        {
          documentId: "private-1",
          score: 0.8,
          content: "Private ticket",
          metadata: {
            scope: "USER_PRIVATE",
            ownerId: "u-2",
            shopId: null,
            sourceTable: "conversation_message",
            sourceRowId: "m-1",
            sourceUpdatedAt: "2026-04-28T00:00:00.000Z",
            chunkIndex: 0,
          },
        },
      ],
    }

    const response = await answerSupportQuestion({
      deps: {
        embeddingProvider,
        searchProvider,
        answerGenerator: new TemplateAnswerGenerator(),
      },
      actor: { role: "USER", userId: "u-1" },
      question: "How do I track my order?",
      topK: 5,
    })

    expect(response.usedContextCount).toBe(1)
    expect(response.citations.map((citation) => citation.documentId)).toEqual([
      "public-1",
    ])
    expect(response.answer.includes("Public FAQ")).toBe(true)
    expect(response.refusalReason).toBeNull()
  })

  test("returns prompt when question is empty", async () => {
    const embeddingProvider: EmbeddingProvider = {
      model: "mock-embed",
      dimension: 3,
      embed: async () => [[0.1, 0.2, 0.3]],
    }

    const searchProvider: VectorSearchProvider = {
      search: async () => [],
    }

    const response = await answerSupportQuestion({
      deps: {
        embeddingProvider,
        searchProvider,
        answerGenerator: new TemplateAnswerGenerator(),
      },
      actor: { role: "GUEST" },
      question: "   ",
    })

    expect(response.usedContextCount).toBe(0)
    expect(response.citations).toEqual([])
    expect(response.answer).toBe("Please provide a question.")
    expect(response.refusalReason).toBe("EMPTY_QUESTION")
  })
})
