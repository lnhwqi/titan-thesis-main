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
import { SupportAnswer, answerSupportQuestion } from "./SupportAssistant"
import { ActorContext } from "./SecurityPolicy"

const searchProvider = new PGVectorSearchProvider()
let embeddingProviderCache: EmbeddingProvider | null = null
let answerGeneratorCache: AnswerGenerator | null = null

export async function answerSupportQuestionRuntime(params: {
  actor: ActorContext
  question: string
  topK?: number
}): Promise<SupportAnswer> {
  const embeddingProvider = _getEmbeddingProvider()
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
  })
}

function _getEmbeddingProvider(): EmbeddingProvider {
  if (embeddingProviderCache != null) {
    return embeddingProviderCache
  }

  const geminiApiKey = process.env.GEMINI_API_KEY ?? ""

  embeddingProviderCache =
    geminiApiKey.trim() !== ""
      ? new GeminiEmbeddingProvider({ apiKey: geminiApiKey })
      : new DeterministicEmbeddingProvider({ dimension: 768 })

  return embeddingProviderCache
}

function _getAnswerGenerator(): AnswerGenerator {
  if (answerGeneratorCache != null) {
    return answerGeneratorCache
  }

  const geminiApiKey = process.env.GEMINI_API_KEY ?? ""

  answerGeneratorCache =
    geminiApiKey.trim() !== ""
      ? new GeminiAnswerGenerator({ apiKey: geminiApiKey })
      : new TemplateAnswerGenerator()

  return answerGeneratorCache
}
