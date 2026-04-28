import { Server as HTTPServer } from "http"
import { createHash, randomUUID } from "node:crypto"
import { Server as SocketIOServer, Socket } from "socket.io"
import { jwtVerify } from "jose"
import * as Logger from "./Logger"
import ENV from "./Env"
import db from "./Database"
import * as ConversationRow from "./Database/ConversationRow"
import * as MessageRow from "./Database/ConversationMessageRow"
import * as OrderPaymentRow from "./Database/OrderPaymentRow"
import { answerSupportQuestionRuntime } from "./AI/SupportRuntime"
import type { ActorContext } from "./AI/SecurityPolicy"
import type { SupportAnswer } from "./AI/SupportAssistant"
import {
  recordSupportMetric,
  type SupportMetricEvent,
} from "./AI/SupportMetrics"

let socketIOInstance: SocketIOServer | null = null

interface AuthUser {
  id: string
  role: "USER" | "SELLER" | "ADMIN" | "GUEST"
  email: string
  name: string
}

const jwtSecret = new TextEncoder().encode(ENV.JWT_SECRET)
const SUPPORT_PARTICIPANT_ID = "00000000-0000-0000-0000-000000000001"
const SUPPORT_PARTICIPANT_TYPE: "SELLER" = "SELLER"
const GUEST_ID_PREFIX = "guest_"
const SUPPORT_MAX_QUESTION_LENGTH = 600
const SUPPORT_MAX_REPLY_LENGTH = 1200
const SUPPORT_MAX_CITATIONS = 3
const SUPPORT_MIN_INTERVAL_MS = 3000
const SUPPORT_WINDOW_MS = 60 * 1000
const SUPPORT_MAX_REQUESTS_PER_WINDOW = 6
const SUPPORT_RATE_LIMIT_STALE_MS = 10 * 60 * 1000
const SUPPORT_RATE_LIMIT_MAP_MAX_SIZE = 5000

type SupportRateLimitState = {
  windowStartAtMs: number
  requestCount: number
  lastRequestAtMs: number
}

type SupportRateLimitResult = {
  allowed: boolean
  message: string
  reason: "OK" | "TOO_FAST" | "WINDOW_LIMIT"
  retryAfterSeconds: number
  windowRequestCount: number
}

type SupportLogContext = {
  supportRequestID: string
  actorRole: AuthUser["role"]
  actorHash: string
  conversationHash: string
}

const supportRateLimitByUser = new Map<string, SupportRateLimitState>()

/**
 * Verify a JWT and resolve the authenticated user by looking up the DB.
 * Handles user/seller/admin tokens (payloads: { userID }, { sellerID }, { adminID }).
 */
async function resolveAuthUser(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret)
    const p: Record<string, unknown> = payload

    if (typeof p.userID === "string") {
      const row = await db
        .selectFrom("user")
        .select(["id", "email", "name", "isDeleted"])
        .where("id", "=", p.userID)
        .executeTakeFirst()
      if (!row || row.isDeleted) return null
      return { id: row.id, role: "USER", email: row.email, name: row.name }
    }

    if (typeof p.sellerID === "string") {
      const row = await db
        .selectFrom("seller")
        .select(["id", "email", "shopName", "isDeleted"])
        .where("id", "=", p.sellerID)
        .executeTakeFirst()
      if (!row || row.isDeleted) return null
      return {
        id: row.id,
        role: "SELLER",
        email: row.email,
        name: row.shopName,
      }
    }

    if (typeof p.adminID === "string") {
      const row = await db
        .selectFrom("admin")
        .select(["id", "email", "name", "isDeleted"])
        .where("id", "=", p.adminID)
        .executeTakeFirst()
      if (!row || row.isDeleted) return null
      return { id: row.id, role: "ADMIN", email: row.email, name: row.name }
    }

    return null
  } catch {
    return null
  }
}

const socketUsers = new WeakMap<Socket, AuthUser>()

type MessageSendData = { conversationID: string; text: string }
type MessageReadData = { messageID: string; conversationID: string }
type TypingData = { conversationID: string }
type MessageListData = { conversationID: string; page?: number; limit?: number }
type ConversationStartData = {
  participantID: string
  participantType: "USER" | "SELLER"
}

type SocketCallback<T> = (response: T) => void
type SuccessResponse<T> = { success: true } & T
type ErrorResponse = { success: false; error: string }

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })
  socketIOInstance = io

  // Authentication middleware (async — resolves user from DB, or accepts guest)
  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    const auth: Record<string, unknown> = socket.handshake.auth
    const token = auth.token
    const guestID = auth.guestID

    // Authenticated user: verify JWT and look up DB
    if (typeof token === "string" && token.length > 0) {
      try {
        const user = await resolveAuthUser(token)
        if (user == null) {
          return next(new Error("Invalid or expired token"))
        }
        socketUsers.set(socket, user)
        return next()
      } catch {
        return next(new Error("Authentication failed"))
      }
    }

    // Guest user: accept any UUID-shaped guestID, no DB lookup needed
    if (typeof guestID === "string" && guestID.length > 0) {
      const guest: AuthUser = {
        id: `${GUEST_ID_PREFIX}${guestID}`,
        role: "GUEST",
        email: "",
        name: "Guest",
      }
      socketUsers.set(socket, guest)
      return next()
    }

    return next(new Error("Authentication required"))
  })

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const user = socketUsers.get(socket)
    if (user == null) return

    Logger.log(`User connected: ${user.email} (${socket.id})`)

    // Join user-specific room
    socket.join(`user:${user.id}`)

    // Broadcast user is online
    socket.broadcast.emit("user:statusChanged", {
      userID: user.id,
      status: "online",
    })

    // ===== MESSAGE HANDLERS =====

    // Send message
    socket.on(
      "message:send",
      async (
        data: MessageSendData,
        callback: SocketCallback<
          SuccessResponse<{ message: unknown }> | ErrorResponse
        >,
      ) => {
        try {
          const { conversationID, text } = data

          if (!text || typeof text !== "string" || text.trim().length === 0) {
            return callback({
              success: false,
              error: "Message text is required",
            })
          }
          if (text.length > 1000) {
            return callback({
              success: false,
              error: "Message is too long (max 1000 characters)",
            })
          }

          // Verify sender is a participant
          const conversation = await ConversationRow.findById(conversationID)
          if (conversation == null) {
            return callback({ success: false, error: "Conversation not found" })
          }
          const isParticipant =
            conversation.user1Id === user.id || conversation.user2Id === user.id
          if (!isParticipant) {
            return callback({ success: false, error: "Access denied" })
          }

          const senderType = user.role === "SELLER" ? "SELLER" : "USER"
          const message = await MessageRow.create({
            conversationId: conversationID,
            senderId: user.id,
            senderType,
            senderName: user.name,
            text: text.trim(),
          })

          await ConversationRow.touch(conversationID)

          const payload = buildClientMessagePayload(message)

          io.to(`conversation:${conversationID}`).emit("message:received", {
            message: payload,
          })
          callback({ success: true, message: payload })

          if (isSupportConversation(conversation)) {
            void sendSupportReply(io, conversationID, user, text.trim())
          }
        } catch (error) {
          Logger.error(error)
          callback({ success: false, error: "Failed to send message" })
        }
      },
    )

    // Typing indicator
    socket.on("message:typing", (data: TypingData) => {
      const { conversationID } = data
      socket.to(`conversation:${conversationID}`).emit("message:userTyping", {
        conversationID,
        userID: user.id,
      })
    })

    // Mark message as read
    socket.on("message:read", async (data: MessageReadData) => {
      try {
        const { messageID, conversationID } = data
        const readAt = new Date()
        await MessageRow.markRead(messageID, readAt)
        socket.to(`conversation:${conversationID}`).emit("message:read", {
          messageID,
          readAt,
        })
      } catch (error) {
        Logger.error(error)
      }
    })

    // Get conversations list
    socket.on(
      "conversation:list",
      async (
        _data: Record<string, never>,
        callback: SocketCallback<
          SuccessResponse<{ conversations: unknown[] }> | ErrorResponse
        >,
      ) => {
        try {
          await ensureSupportConversation(user)
          await ensurePaidOrderConversations(user)
          const rows = await ConversationRow.listForUser(user.id)

          const conversations = await Promise.all(
            rows.map(async (conv) => {
              const isUser1 = conv.user1Id === user.id
              const otherPartyId = isUser1 ? conv.user2Id : conv.user1Id
              const otherPartyType = isUser1 ? conv.user2Type : conv.user1Type
              const participantName = await resolveName(
                otherPartyId,
                otherPartyType,
              )
              const lastMessage = await MessageRow.getLatest(conv.id)
              const lastMessagePayload =
                lastMessage == null
                  ? null
                  : buildClientMessagePayload(lastMessage)
              const unreadCount = await MessageRow.countUnread(conv.id, user.id)
              return {
                id: conv.id,
                participantIDs: otherPartyId,
                participantName,
                lastMessage: lastMessagePayload,
                unreadCount,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
              }
            }),
          )

          callback({ success: true, conversations })
        } catch (error) {
          Logger.error(error)
          callback({ success: false, error: "Failed to fetch conversations" })
        }
      },
    )

    // Get messages for conversation
    socket.on(
      "message:list",
      async (
        data: MessageListData,
        callback: SocketCallback<
          | SuccessResponse<{
              messages: unknown[]
              page: number
              totalCount: number
            }>
          | ErrorResponse
        >,
      ) => {
        try {
          const { conversationID, page = 1, limit = 20 } = data

          const conversation = await ConversationRow.findById(conversationID)
          if (conversation == null) {
            return callback({ success: false, error: "Conversation not found" })
          }
          const isParticipant =
            conversation.user1Id === user.id || conversation.user2Id === user.id
          if (!isParticipant) {
            return callback({ success: false, error: "Access denied" })
          }

          // Join conversation room so future messages are pushed here
          socket.join(`conversation:${conversationID}`)

          const { messages, totalCount } = await MessageRow.listForConversation(
            conversationID,
            page,
            limit,
          )

          callback({
            success: true,
            messages: messages.map((m) => buildClientMessagePayload(m)),
            page,
            totalCount,
          })
        } catch (error) {
          Logger.error(error)
          callback({ success: false, error: "Failed to fetch messages" })
        }
      },
    )

    // Start or get existing conversation
    socket.on(
      "conversation:start",
      async (
        data: ConversationStartData,
        callback: SocketCallback<
          SuccessResponse<{ conversation: unknown }> | ErrorResponse
        >,
      ) => {
        try {
          const { participantID, participantType } = data

          if (!participantID || !participantType) {
            return callback({
              success: false,
              error: "participantID and participantType are required",
            })
          }
          if (participantID === user.id) {
            return callback({
              success: false,
              error: "Cannot start a conversation with yourself",
            })
          }

          if (user.role === "SELLER" && participantType === "USER") {
            const hasPaidOrder = await OrderPaymentRow.hasPaidOrderBetween(
              participantID,
              user.id,
            )
            if (!hasPaidOrder) {
              return callback({
                success: false,
                error:
                  "You can only message users who purchased from your shop",
              })
            }
          }

          let conversation = await ConversationRow.findBetween(
            user.id,
            participantID,
          )
          const myType = user.role === "SELLER" ? "SELLER" : "USER"
          if (conversation == null) {
            conversation = await ConversationRow.create(
              user.id,
              myType,
              participantID,
              participantType,
            )
          }

          const participantName = await resolveName(
            participantID,
            participantType,
          )

          const result = {
            id: conversation.id,
            participantIDs: participantID,
            participantName,
            lastMessage: null,
            unreadCount: 0,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          }

          callback({ success: true, conversation: result })

          // Notify the other party so their list refreshes
          io.to(`user:${participantID}`).emit("conversation:updated", {
            conversationID: conversation.id,
          })
        } catch (error) {
          Logger.error(error)
          callback({ success: false, error: "Failed to start conversation" })
        }
      },
    )

    // ===== DISCONNECT HANDLER =====
    socket.on("disconnect", () => {
      Logger.log(`User disconnected: ${user.email} (${socket.id})`)
      socket.broadcast.emit("user:statusChanged", {
        userID: user.id,
        status: "offline",
      })
    })
  })

  return io
}

export function getSocketIO(): SocketIOServer | null {
  return socketIOInstance
}

/**
 * Resolve display name for a participant
 */
async function resolveName(
  id: string,
  type: "USER" | "SELLER",
): Promise<string> {
  if (id === SUPPORT_PARTICIPANT_ID) return "Titan Support"
  if (id.startsWith("guest_")) return "Guest"
  try {
    if (type === "USER") {
      const row = await db
        .selectFrom("user")
        .select("name")
        .where("id", "=", id)
        .executeTakeFirst()
      return row?.name ?? "Unknown User"
    } else {
      const row = await db
        .selectFrom("seller")
        .select("shopName")
        .where("id", "=", id)
        .executeTakeFirst()
      return row?.shopName ?? "Unknown Seller"
    }
  } catch {
    return type === "USER" ? "Unknown User" : "Unknown Seller"
  }
}

async function ensureSupportConversation(user: AuthUser): Promise<void> {
  if (user.role === "ADMIN") {
    return
  }

  const existing = await ConversationRow.findBetween(
    user.id,
    SUPPORT_PARTICIPANT_ID,
  )
  if (existing != null) {
    return
  }

  const myType: "USER" | "SELLER" = user.role === "SELLER" ? "SELLER" : "USER"

  try {
    await ConversationRow.create(
      user.id,
      myType,
      SUPPORT_PARTICIPANT_ID,
      SUPPORT_PARTICIPANT_TYPE,
    )
  } catch {
    // Ignore duplicate/create races.
  }
}

async function ensurePaidOrderConversations(user: AuthUser): Promise<void> {
  if (user.role !== "USER" && user.role !== "SELLER") {
    return
  }

  const participantType: "USER" | "SELLER" =
    user.role === "SELLER" ? "SELLER" : "USER"

  const pairs = await OrderPaymentRow.getPaidConversationPairsForParticipant(
    user.id,
    participantType,
  )

  for (const pair of pairs) {
    const existing = await ConversationRow.findBetween(
      pair.userId,
      pair.sellerId,
    )
    if (existing == null) {
      try {
        await ConversationRow.create(
          pair.userId,
          "USER",
          pair.sellerId,
          "SELLER",
        )
      } catch {
        // Ignore duplicate/create races; conversation list below will fetch existing rows.
      }
    }
  }
}

/**
 * Emit system message to specific conversation
 */
export function broadcastSystemMessage(
  io: SocketIOServer,
  conversationID: string,
  text: string,
): void {
  io.to(`conversation:${conversationID}`).emit("message:received", {
    message: {
      id: `sys_${Date.now()}`,
      conversationID,
      senderID: "SYSTEM",
      senderType: "SYSTEM",
      senderName: "System",
      text,
      readAt: null,
      createdAt: new Date(),
    },
  })
}

/**
 * Emit system notification to specific user
 */
export function broadcastSystemNotification(
  io: SocketIOServer,
  userID: string,
  message: string,
): void {
  io.to(`user:${userID}`).emit("notification:system", {
    message,
    timestamp: new Date(),
  })
}

function buildClientMessagePayload(message: MessageRow.MessageRow): {
  id: string
  conversationID: string
  senderID: string
  senderType: "USER" | "SELLER" | "SYSTEM"
  senderName: string
  text: string
  readAt: Date | null
  createdAt: Date
} {
  return {
    id: message.id,
    conversationID: message.conversationId,
    senderID: toClientSenderID(message.senderId, message.senderType),
    senderType: message.senderType,
    senderName: message.senderName,
    text: message.text,
    readAt: message.readAt,
    createdAt: message.createdAt,
  }
}

function toClientSenderID(
  senderId: string,
  senderType: "USER" | "SELLER" | "SYSTEM",
): string {
  if (senderType === "SYSTEM") {
    return "SYSTEM"
  }

  if (senderId.startsWith(GUEST_ID_PREFIX)) {
    const normalized = senderId.substring(GUEST_ID_PREFIX.length)
    return normalized.length > 0 ? normalized : senderId
  }

  return senderId
}

function isSupportConversation(
  conversation: ConversationRow.ConversationRow,
): boolean {
  return (
    conversation.user1Id === SUPPORT_PARTICIPANT_ID ||
    conversation.user2Id === SUPPORT_PARTICIPANT_ID
  )
}

function toSupportActor(user: AuthUser): ActorContext {
  if (user.role === "USER") {
    return { role: "USER", userId: user.id }
  }

  if (user.role === "SELLER") {
    return { role: "SELLER", sellerId: user.id }
  }

  if (user.role === "ADMIN") {
    return { role: "ADMIN", adminId: user.id }
  }

  return { role: "GUEST" }
}

async function sendSupportReply(
  io: SocketIOServer,
  conversationID: string,
  user: AuthUser,
  question: string,
): Promise<void> {
  const startedAtMs = Date.now()
  const logContext = createSupportLogContext(user, conversationID)
  const normalizedQuestion = normalizeSupportQuestion(question)

  logSupportMetric("REQUEST_RECEIVED", {
    ...logContext,
    questionLength: normalizedQuestion.length,
  })

  if (normalizedQuestion.length === 0) {
    logSupportMetric("REQUEST_REJECTED", {
      ...logContext,
      reason: "EMPTY_QUESTION",
    })
    return
  }

  if (normalizedQuestion.length > SUPPORT_MAX_QUESTION_LENGTH) {
    logSupportMetric("REQUEST_REJECTED", {
      ...logContext,
      reason: "QUESTION_TOO_LONG",
      questionLength: normalizedQuestion.length,
      maxQuestionLength: SUPPORT_MAX_QUESTION_LENGTH,
    })

    await sendSupportSystemMessage(
      io,
      conversationID,
      user.id,
      `Please keep your question under ${SUPPORT_MAX_QUESTION_LENGTH} characters.`,
    )
    return
  }

  const rateLimit = checkSupportRateLimit(user.id)
  if (!rateLimit.allowed) {
    logSupportMetric("REQUEST_RATE_LIMITED", {
      ...logContext,
      reason: rateLimit.reason,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      windowRequestCount: rateLimit.windowRequestCount,
    })

    await sendSupportSystemMessage(
      io,
      conversationID,
      user.id,
      rateLimit.message,
    )
    return
  }

  try {
    const response = await answerSupportQuestionRuntime({
      actor: toSupportActor(user),
      question: normalizedQuestion,
      topK: 6,
    })

    const citationLines = formatSupportCitations(response)
    const answerText = formatSupportAnswer(response, citationLines)
    const latencyMs = Date.now() - startedAtMs

    logSupportMetric("ANSWER_GENERATED", {
      ...logContext,
      latencyMs,
      usedContextCount: response.usedContextCount,
      citationsRetrieved: response.citations.length,
      citationsIncluded: citationLines.length,
      answerLength: answerText.length,
    })

    if (answerText.length === 0) {
      logSupportMetric("ANSWER_SKIPPED", {
        ...logContext,
        reason: "EMPTY_FORMATTED_ANSWER",
      })
      return
    }

    const delivered = await sendSupportSystemMessage(
      io,
      conversationID,
      user.id,
      answerText,
    )

    logSupportMetric("ANSWER_DELIVERED", {
      ...logContext,
      delivered,
    })
  } catch (error) {
    const latencyMs = Date.now() - startedAtMs
    const errorMessage = normalizeErrorMessage(error)

    Logger.error(`AI support reply failed: ${error}`)
    logSupportMetric("ANSWER_FAILED", {
      ...logContext,
      latencyMs,
      errorMessage,
    })

    const fallbackDelivered = await sendSupportSystemMessage(
      io,
      conversationID,
      user.id,
      "I'm having trouble right now. Please try again in a moment.",
    )

    logSupportMetric("FALLBACK_DELIVERED", {
      ...logContext,
      delivered: fallbackDelivered,
    })
  }
}

async function sendSupportSystemMessage(
  io: SocketIOServer,
  conversationID: string,
  userID: string,
  text: string,
): Promise<boolean> {
  try {
    const supportMessage = await MessageRow.create({
      conversationId: conversationID,
      senderId: "SYSTEM",
      senderType: "SYSTEM",
      senderName: "Titan Support",
      text,
    })

    await ConversationRow.touch(conversationID)

    io.to(`conversation:${conversationID}`).emit("message:received", {
      message: buildClientMessagePayload(supportMessage),
    })

    io.to(`user:${userID}`).emit("conversation:updated", {
      conversationID,
    })

    return true
  } catch (error) {
    Logger.error(`Support system message delivery failed: ${error}`)
    return false
  }
}

function normalizeSupportQuestion(question: string): string {
  const collapsed = question.replace(/\s+/g, " ").trim()
  return collapsed
}

function formatSupportAnswer(
  response: SupportAnswer,
  citationLines: string[],
): string {
  const answer = clampSupportText(
    response.answer.trim(),
    SUPPORT_MAX_REPLY_LENGTH,
  )
  if (answer.length === 0) {
    return ""
  }

  if (citationLines.length === 0) {
    return answer
  }

  const combined = `${answer}\n\nSources:\n${citationLines.join("\n")}`
  return clampSupportText(combined, SUPPORT_MAX_REPLY_LENGTH)
}

function formatSupportCitations(response: SupportAnswer): string[] {
  const bestBySource = new Map<string, { source: string; score: number }>()

  response.citations.forEach((citation) => {
    const source = `${citation.sourceTable}/${citation.sourceRowId}`
    const existing = bestBySource.get(source)
    if (existing == null || citation.score > existing.score) {
      bestBySource.set(source, { source, score: citation.score })
    }
  })

  return Array.from(bestBySource.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, SUPPORT_MAX_CITATIONS)
    .map(
      (item, index) =>
        `${index + 1}. ${item.source} (${item.score.toFixed(2)})`,
    )
}

function clampSupportText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  if (maxLength <= 1) {
    return ""
  }

  return `${text.slice(0, maxLength - 1)}…`
}

function checkSupportRateLimit(userID: string): SupportRateLimitResult {
  const now = Date.now()
  cleanupSupportRateLimitMap(now)

  const state = supportRateLimitByUser.get(userID)
  if (state == null) {
    supportRateLimitByUser.set(userID, {
      windowStartAtMs: now,
      requestCount: 1,
      lastRequestAtMs: now,
    })

    return {
      allowed: true,
      message: "",
      reason: "OK",
      retryAfterSeconds: 0,
      windowRequestCount: 1,
    }
  }

  if (now - state.lastRequestAtMs < SUPPORT_MIN_INTERVAL_MS) {
    const waitSeconds = Math.ceil(
      (SUPPORT_MIN_INTERVAL_MS - (now - state.lastRequestAtMs)) / 1000,
    )
    return {
      allowed: false,
      message: `Please wait ${waitSeconds}s before sending another support question.`,
      reason: "TOO_FAST",
      retryAfterSeconds: waitSeconds,
      windowRequestCount: state.requestCount,
    }
  }

  if (now - state.windowStartAtMs > SUPPORT_WINDOW_MS) {
    state.windowStartAtMs = now
    state.requestCount = 0
  }

  if (state.requestCount >= SUPPORT_MAX_REQUESTS_PER_WINDOW) {
    const remaining = Math.max(
      1,
      SUPPORT_WINDOW_MS - (now - state.windowStartAtMs),
    )
    const waitSeconds = Math.ceil(remaining / 1000)
    return {
      allowed: false,
      message: `Support is busy. Please try again in about ${waitSeconds}s.`,
      reason: "WINDOW_LIMIT",
      retryAfterSeconds: waitSeconds,
      windowRequestCount: state.requestCount,
    }
  }

  state.requestCount += 1
  state.lastRequestAtMs = now
  supportRateLimitByUser.set(userID, state)

  return {
    allowed: true,
    message: "",
    reason: "OK",
    retryAfterSeconds: 0,
    windowRequestCount: state.requestCount,
  }
}

function cleanupSupportRateLimitMap(now: number): void {
  if (supportRateLimitByUser.size <= SUPPORT_RATE_LIMIT_MAP_MAX_SIZE) {
    return
  }

  const sizeBefore = supportRateLimitByUser.size
  let removedCount = 0

  supportRateLimitByUser.forEach((state, key) => {
    const lastSeen = Math.max(state.lastRequestAtMs, state.windowStartAtMs)
    if (now - lastSeen > SUPPORT_RATE_LIMIT_STALE_MS) {
      supportRateLimitByUser.delete(key)
      removedCount += 1
    }
  })

  if (removedCount > 0) {
    logSupportMetric("RATE_LIMIT_MAP_CLEANUP", {
      removedCount,
      sizeBefore,
      sizeAfter: supportRateLimitByUser.size,
    })
  }
}

function createSupportLogContext(
  user: AuthUser,
  conversationID: string,
): SupportLogContext {
  return {
    supportRequestID: randomUUID(),
    actorRole: user.role,
    actorHash: hashForLogs(user.id),
    conversationHash: hashForLogs(conversationID),
  }
}

function hashForLogs(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return clampSupportText(error.message, 300)
  }

  return clampSupportText(String(error), 300)
}

function logSupportMetric(
  event: SupportMetricEvent,
  payload: Record<string, unknown>,
): void {
  recordSupportMetric(event, payload)

  Logger.log({
    _t: "SUPPORT_AI_METRIC",
    event,
    at: new Date().toISOString(),
    ...payload,
  })
}
