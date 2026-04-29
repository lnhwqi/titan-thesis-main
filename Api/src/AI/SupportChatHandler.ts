/**
 * SupportChatHandler
 *
 * Wires the AI RAG pipeline into the socket chat system.
 * When a user/seller/guest sends a message in a support conversation,
 * this module generates an AI reply from Titan Support and emits it
 * back to the conversation room.
 *
 * Rate limits per user to prevent abuse:
 *   - Max 5 AI-triggered requests per 30-second window.
 *   - Hard skip if an AI reply is already in-flight for the same conversation.
 */

import type { Server as SocketIOServer } from "socket.io"
import * as MessageRow from "../Database/ConversationMessageRow"
import * as ConversationRow from "../Database/ConversationRow"
import * as Logger from "../Logger"
import { answerSupportQuestionRuntime } from "./SupportRuntime"
import { recordSupportMetric } from "./SupportMetrics"
import type { ActorContext } from "./SecurityPolicy"
import type { ConversationTurn } from "./SupportAssistant"

// ── Constants ────────────────────────────────────────────────────────────────

const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"
const AI_SENDER_NAME = "Titan Support"

// How many prior turns (user + assistant pairs) to include for context
const HISTORY_TURNS = 3

// Rate-limit: 5 questions per 30 s per actor ID
const RATE_WINDOW_MS = 30_000
const RATE_MAX_PER_WINDOW = 5

// ── State (process-scoped, reset on server restart) ──────────────────────────

// actorKey -> sorted list of timestamps within window
const rateLimitMap = new Map<string, number[]>()
// conversationID -> true when an AI reply is already being generated
const inFlightSet = new Set<string>()

// Periodic cleanup of stale rate-limit entries every 5 minutes.
setInterval(
  () => {
    const now = Date.now()
    let removed = 0
    const sizeBefore = rateLimitMap.size
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS)
      if (recent.length === 0) {
        rateLimitMap.delete(key)
        removed++
      } else {
        rateLimitMap.set(key, recent)
      }
    }
    recordSupportMetric("RATE_LIMIT_MAP_CLEANUP", {
      removedCount: removed,
      sizeBefore,
      sizeAfter: rateLimitMap.size,
    })
  },
  5 * 60 * 1000,
).unref()

// ── Public API ────────────────────────────────────────────────────────────────

export type SupportChatHandlerParams = {
  io: SocketIOServer
  conversationID: string
  userMessage: string
  actor: ActorContext
}

/**
 * Fire-and-forget: call this after the user's own message has been stored
 * and emitted. It will asynchronously generate and deliver an AI reply.
 */
export function enqueueSupportAIReply(params: SupportChatHandlerParams): void {
  setImmediate(() => {
    void _handleSupportAIReply(params).catch((err: unknown) => {
      Logger.error(err)
    })
  })
}

// ── Internal logic ────────────────────────────────────────────────────────────

function _actorKey(actor: ActorContext): string {
  if (actor.role === "USER") return `user:${actor.userId}`
  if (actor.role === "SELLER") return `seller:${actor.sellerId}`
  if (actor.role === "ADMIN") return `admin:${actor.adminId}`
  return "guest"
}

function _isRateLimited(actor: ActorContext): boolean {
  const key = _actorKey(actor)
  const now = Date.now()
  const existing = rateLimitMap.get(key) ?? []
  const recent = existing.filter((t) => now - t < RATE_WINDOW_MS)

  if (recent.length >= RATE_MAX_PER_WINDOW) {
    rateLimitMap.set(key, recent)
    return true
  }

  recent.push(now)
  rateLimitMap.set(key, recent)
  return false
}

async function _handleSupportAIReply(
  params: SupportChatHandlerParams,
): Promise<void> {
  const { io, conversationID, userMessage, actor } = params

  recordSupportMetric("REQUEST_RECEIVED", {})

  // Prevent duplicate in-flight replies for the same conversation
  if (inFlightSet.has(conversationID)) {
    recordSupportMetric("ANSWER_SKIPPED", { reason: "IN_FLIGHT" })
    return
  }

  if (_isRateLimited(actor)) {
    recordSupportMetric("REQUEST_RATE_LIMITED", { reason: "WINDOW_LIMIT" })
    return
  }

  inFlightSet.add(conversationID)
  const startMs = Date.now()

  try {
    const history = await _fetchHistory(conversationID)

    const result = await answerSupportQuestionRuntime({
      actor,
      question: userMessage,
      history,
    })

    const latencyMs = Date.now() - startMs

    if (result.refusalReason != null) {
      recordSupportMetric("ANSWER_SKIPPED", {
        reason: result.refusalReason,
        latencyMs,
      })
      // Still deliver a helpful fallback message so the user gets a response
      await _deliverAIMessage(io, conversationID, result.answer)
      recordSupportMetric("FALLBACK_DELIVERED", {})
      return
    }

    recordSupportMetric("ANSWER_GENERATED", {
      latencyMs,
      citationsIncluded: result.citations.length,
      citationsRetrieved: result.usedContextCount,
    })

    await _deliverAIMessage(io, conversationID, result.answer)

    recordSupportMetric("ANSWER_DELIVERED", { latencyMs })
  } catch (err) {
    Logger.error(err)
    recordSupportMetric("ANSWER_FAILED", {})

    // Deliver a graceful error message so the conversation doesn't go silent
    await _deliverAIMessage(
      io,
      conversationID,
      "Sorry, I had trouble processing your question. A human support agent will follow up shortly.",
    ).catch(() => {
      /* swallow secondary failure */
    })
  } finally {
    inFlightSet.delete(conversationID)
  }
}

async function _deliverAIMessage(
  io: SocketIOServer,
  conversationID: string,
  text: string,
): Promise<void> {
  const message = await MessageRow.create({
    conversationId: conversationID,
    senderId: SUPPORT_PARTICIPANT_ID,
    senderType: "SYSTEM",
    senderName: AI_SENDER_NAME,
    text,
  })
  await ConversationRow.touch(conversationID)

  io.to(`conversation:${conversationID}`).emit("message:received", {
    message: {
      id: message.id,
      conversationID: message.conversationId,
      senderID: message.senderId,
      senderType: message.senderType,
      senderName: message.senderName,
      text: message.text,
      readAt: message.readAt,
      createdAt: message.createdAt,
    },
  })
}

async function _fetchHistory(
  conversationID: string,
): Promise<ConversationTurn[]> {
  // Fetch the last HISTORY_TURNS*2 messages (user + assistant per turn)
  // excluding the current message which hasn't been stored yet at this point.
  const { messages } = await MessageRow.listForConversation(
    conversationID,
    1,
    HISTORY_TURNS * 2,
  )

  const turns: ConversationTurn[] = []

  for (const msg of messages) {
    if (msg.senderType === "SYSTEM") {
      turns.push({ role: "assistant", text: msg.text })
    } else if (
      msg.senderType === "USER" ||
      msg.senderType === "SELLER" ||
      msg.senderType === "GUEST"
    ) {
      turns.push({ role: "user", text: msg.text })
    }
  }

  return turns
}
