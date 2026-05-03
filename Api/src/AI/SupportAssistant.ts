import { AnswerGenerator, AnswerGeneratorHistory } from "./Answer"
import { EmbeddingProvider } from "./Embedding"
import { VectorSearchProvider, searchWithPolicyFilter } from "./Retrieval"
import { ActorContext } from "./SecurityPolicy"
import {
  //redactPIIPatterns,
  sanitizeRetrievedContext,
  stripPromptInjectionDirectives,
} from "./Safety"

export type { AnswerGeneratorHistory as ConversationTurn } from "./Answer"

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
  modelId: string
  refusalReason: "EMPTY_QUESTION" | "INSUFFICIENT_CONTEXT" | null
}

export async function answerSupportQuestion(params: {
  deps: SupportAssistantDeps
  actor: ActorContext
  question: string
  topK?: number
  history?: AnswerGeneratorHistory[]
}): Promise<SupportAnswer> {
  const question = stripPromptInjectionDirectives(params.question)
  if (question === "") {
    return {
      answer: "Please provide a question.",
      citations: [],
      usedContextCount: 0,
      modelId: params.deps.answerGenerator.model,
      refusalReason: "EMPTY_QUESTION",
    }
  }

  const topK = _resolveTopK(params.actor, params.topK)
  const minScore = _resolveScoreThreshold(params.actor)

  // Build an expanded search query by prepending the last user message from
  // history so short follow-ups like "least price" resolve to their topic.
  const searchQuery = _buildSearchQuery(question, params.history)

  const queryEmbeddings = await params.deps.embeddingProvider.embed([
    searchQuery,
  ])
  const queryEmbedding = queryEmbeddings[0] ?? []

  const matches = await searchWithPolicyFilter({
    provider: params.deps.searchProvider,
    actor: params.actor,
    request: {
      queryEmbedding,
      topK,
    },
  })

  const confidentMatches = matches.filter((match) => match.score >= minScore)

  if (confidentMatches.length === 0) {
    return {
      answer:
        "I do not have enough trusted context to answer this safely. Please contact support staff.",
      citations: [],
      usedContextCount: 0,
      modelId: params.deps.answerGenerator.model,
      refusalReason: "INSUFFICIENT_CONTEXT",
    }
  }

  const contexts: string[] = []

  confidentMatches.forEach((match, index) => {
    const safeContext = sanitizeRetrievedContext(match.content)

    if (safeContext === "") {
      return
    }

    contexts.push(
      [
        `#${index + 1}`,
        `Source: ${match.metadata.sourceTable}/${match.metadata.sourceRowId}`,
        `Score: ${match.score.toFixed(4)}`,
        safeContext,
      ].join("\n"),
    )
  })

  if (contexts.length === 0) {
    return {
      answer:
        "I do not have enough trusted context to answer this safely. Please contact support staff.",
      citations: [],
      usedContextCount: 0,
      modelId: params.deps.answerGenerator.model,
      refusalReason: "INSUFFICIENT_CONTEXT",
    }
  }

  const answer = await params.deps.answerGenerator.generate({
    question,
    contexts,
    history: params.history,
    maxTokens: params.actor.role === "GUEST" ? 512 : 768,
  })

  return {
    answer: answer,
    citations: confidentMatches.map((match) => ({
      documentId: match.documentId,
      sourceTable: match.metadata.sourceTable,
      sourceRowId: match.metadata.sourceRowId,
      score: match.score,
    })),
    usedContextCount: contexts.length,
    modelId: params.deps.answerGenerator.model,
    refusalReason: null,
  }
}

function _resolveTopK(
  actor: ActorContext,
  preferred: number | undefined,
): number {
  const fallback = actor.role === "GUEST" ? 8 : 12
  const target = preferred ?? fallback
  const rounded = Math.floor(target)

  if (!Number.isFinite(rounded) || rounded < 1) {
    return fallback
  }

  return Math.min(12, rounded)
}

function _resolveScoreThreshold(actor: ActorContext): number {
  if (actor.role === "GUEST") {
    return 0.45
  }

  return 0.4
}

// How many characters of the last user message to prepend when the current
// question looks like a follow-up (short and lacking a topic keyword).
const HISTORY_CONTEXT_CHAR_LIMIT = 120
const SHORT_QUESTION_THRESHOLD = 40

function _buildSearchQuery(
  question: string,
  history: AnswerGeneratorHistory[] | undefined,
): string {
  if (question.length >= SHORT_QUESTION_THRESHOLD || !history?.length) {
    return question
  }

  // Find the last user turn before the current one
  const lastUserTurn = [...history].reverse().find((t) => t.role === "user")

  if (lastUserTurn == null) {
    return question
  }

  const prefix = lastUserTurn.text.slice(0, HISTORY_CONTEXT_CHAR_LIMIT).trim()
  return `${prefix} ${question}`
}
