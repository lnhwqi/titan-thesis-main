import {
  AnswerGenerator,
  GeminiAnswerGenerator,
  TemplateAnswerGenerator,
} from "./Answer"
import {
  DeterministicEmbeddingProvider,
  EmbeddingProvider,
  GeminiEmbeddingProvider,
} from "./Embedding"
import { PGVectorSearchProvider } from "./PGVectorSearchProvider"
import { createPineconeProviderFromEnv } from "./PineconeVectorProvider"
import { type VectorSearchProvider } from "./Retrieval"
import {
  SupportAnswer,
  ConversationTurn,
  answerSupportQuestion,
} from "./SupportAssistant"
import { ActorContext } from "./SecurityPolicy"
import { assertVectorDatabaseSecurity } from "./Config"

let searchProviderCache: VectorSearchProvider | null = null
let embeddingProviderCache: EmbeddingProvider | null = null
let answerGeneratorCache: AnswerGenerator | null = null

export async function answerSupportQuestionRuntime(params: {
  actor: ActorContext
  question: string
  topK?: number
  history?: ConversationTurn[]
}): Promise<SupportAnswer> {
  assertVectorDatabaseSecurity()

  const embeddingProvider = _getEmbeddingProvider()
  const searchProvider = _getSearchProvider()
  const answerGenerator = _getAnswerGenerator()

  return answerSupportQuestion({
    deps: {
      embeddingProvider,
      searchProvider,
      answerGenerator,
    },
    actor: params.actor,
    question: params.question,
    topK: params.topK,
    history: params.history,
  })
}

function _getSearchProvider(): VectorSearchProvider {
  if (searchProviderCache != null) {
    return searchProviderCache
  }

  searchProviderCache =
    createPineconeProviderFromEnv() ?? new PGVectorSearchProvider()
  return searchProviderCache
}

function _getEmbeddingProvider(): EmbeddingProvider {
  if (embeddingProviderCache != null) {
    return embeddingProviderCache
  }

  const geminiApiKey = process.env.GEMINI_API_KEY ?? ""
  const geminiBaseURL = process.env.GEMINI_BASE_URL

  embeddingProviderCache =
    geminiApiKey.trim() !== ""
      ? new GeminiEmbeddingProvider({
          apiKey: geminiApiKey,
          baseURL: geminiBaseURL,
        })
      : new DeterministicEmbeddingProvider({ dimension: 3072 })

  return embeddingProviderCache
}

function _getAnswerGenerator(): AnswerGenerator {
  if (answerGeneratorCache != null) {
    return answerGeneratorCache
  }

  const geminiApiKey = process.env.GEMINI_API_KEY ?? ""
  const geminiBaseURL = process.env.GEMINI_BASE_URL

  answerGeneratorCache =
    geminiApiKey.trim() !== ""
      ? new GeminiAnswerGenerator({
          apiKey: geminiApiKey,
          baseURL: geminiBaseURL,
        })
      : new TemplateAnswerGenerator()

  return answerGeneratorCache
}
