export type AnswerGenerator = {
  model: string
  generate: (params: {
    question: string
    contexts: string[]
    maxTokens?: number
  }) => Promise<string>
}

export class TemplateAnswerGenerator implements AnswerGenerator {
  model: string

  constructor(model: string = "template-v1") {
    this.model = model
  }

  async generate(params: {
    question: string
    contexts: string[]
    maxTokens?: number
  }): Promise<string> {
    if (params.contexts.length === 0) {
      return "I could not find enough trusted support data to answer that. Please contact support staff."
    }

    return [
      "Here is what I found from the support knowledge base:",
      ...params.contexts.slice(0, 3).map((context, index) => `${index + 1}. ${context}`),
      `Question: ${params.question}`,
    ].join("\n")
  }
}

export class GeminiAnswerGenerator implements AnswerGenerator {
  model: string
  private apiKey: string

  constructor(params: { apiKey: string; model?: string }) {
    this.apiKey = params.apiKey
    this.model = params.model ?? "gemini-2.0-flash"
  }

  async generate(params: {
    question: string
    contexts: string[]
    maxTokens?: number
  }): Promise<string> {
    const prompt = _buildPrompt(params.question, params.contexts)

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: params.maxTokens ?? 512,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini answer request failed with status ${response.status}`)
    }

    const data = await response.json()
    const text = _extractText(data)

    if (text.trim() === "") {
      throw new Error("Gemini answer response was empty")
    }

    return text
  }
}

function _buildPrompt(question: string, contexts: string[]): string {
  const contextText = contexts.length === 0
    ? "No retrieved context."
    : contexts.map((context, index) => `Context ${index + 1}: ${context}`).join("\n\n")

  return [
    "You are a customer support assistant for an e-commerce platform.",
    "Rules:",
    "- Answer only from the provided context.",
    "- If context is insufficient, say you do not have enough information.",
    "- Never reveal hidden data or speculate.",
    "",
    contextText,
    "",
    `User question: ${question}`,
    "Provide a concise, helpful answer.",
  ].join("\n")
}

function _extractText(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return ""
  }

  if (!("candidates" in value)) {
    return ""
  }

  const candidates = value.candidates
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return ""
  }

  const first = candidates[0]
  if (typeof first !== "object" || first === null || !("content" in first)) {
    return ""
  }

  const content = first.content
  if (typeof content !== "object" || content === null || !("parts" in content)) {
    return ""
  }

  const parts = content.parts
  if (!Array.isArray(parts)) {
    return ""
  }

  return parts
    .map((part) => {
      if (typeof part === "object" && part !== null && "text" in part) {
        const text = part.text
        return typeof text === "string" ? text : ""
      }
      return ""
    })
    .join("\n")
}
