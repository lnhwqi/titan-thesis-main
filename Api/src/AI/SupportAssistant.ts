import { AnswerGenerator } from "./Answer"
import { EmbeddingProvider } from "./Embedding"
import { VectorSearchProvider, searchWithPolicyFilter } from "./Retrieval"
import { ActorContext } from "./SecurityPolicy"

export type SupportAssistantDeps = {
  embeddingProvider: EmbeddingProvider
  searchProvider: VectorSearchProvider
  answerGenerator: AnswerGenerator
}

export type SupportAnswer = {
  answer: string
  citations: Array<{
    documentId: string
    sourceTable: string
    sourceRowId: string
    score: number
  }>
  usedContextCount: number
}

export async function answerSupportQuestion(params: {
  deps: SupportAssistantDeps
  actor: ActorContext
  question: string
  topK?: number
}): Promise<SupportAnswer> {
  const question = params.question.trim()
  if (question === "") {
    return {
      answer: "Please provide a question.",
      citations: [],
      usedContextCount: 0,
    }
  }

  const queryEmbeddings = await params.deps.embeddingProvider.embed([question])
  const queryEmbedding = queryEmbeddings[0] ?? []

  const matches = await searchWithPolicyFilter({
    provider: params.deps.searchProvider,
    actor: params.actor,
    request: {
      queryEmbedding,
      topK: params.topK ?? 6,
    },
  })

  const contexts = matches.map((match, index) => {
    return [
      `#${index + 1}`,
      `Source: ${match.metadata.sourceTable}/${match.metadata.sourceRowId}`,
      `Score: ${match.score.toFixed(4)}`,
      match.content,
    ].join("\n")
  })

  const answer = await params.deps.answerGenerator.generate({
    question,
    contexts,
    maxTokens: 512,
  })

  return {
    answer,
    citations: matches.map((match) => ({
      documentId: match.documentId,
      sourceTable: match.metadata.sourceTable,
      sourceRowId: match.metadata.sourceRowId,
      score: match.score,
    })),
    usedContextCount: contexts.length,
  }
}
