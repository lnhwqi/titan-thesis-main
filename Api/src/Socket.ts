import { Server as HTTPServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"
import { jwtVerify } from "jose"
import * as Logger from "./Logger"
import ENV from "./Env"
import db from "./Database"
import * as ConversationRow from "./Database/ConversationRow"
import * as MessageRow from "./Database/ConversationMessageRow"
import * as OrderPaymentRow from "./Database/OrderPaymentRow"
import * as CoinRainRow from "./Database/CoinRainRow"
import * as CoinRainTx from "./Transaction/CoinRainTx"
import {
  enqueueSupportAIReply,
  type SupportChatHandlerParams,
} from "./AI/SupportChatHandler"
import type { ActorContext } from "./AI/SecurityPolicy"

interface AuthUser {
  id: string
  role: "USER" | "SELLER" | "ADMIN" | "GUEST"
  email: string
  name: string
}

const jwtSecret = new TextEncoder().encode(ENV.JWT_SECRET)
const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"
const LEGACY_SUPPORT_PARTICIPANT_ID = "00000000-0000-0000-0000-000000000001"
const SUPPORT_PARTICIPANT_TYPE: "SELLER" = "SELLER"
const GUEST_ID_PREFIX = "guest_"

let socketIOInstance: SocketIOServer | null = null

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

  // Authentication middleware (async — resolves authenticated user from DB)
  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    const auth: Record<string, unknown> = socket.handshake.auth
    const token = auth.token

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
          if (user.role === "GUEST" && !isSupportConversation(conversation)) {
            return callback({
              success: false,
              error: "Login required for non-support conversations",
            })
          }
          // Admin can send messages in support conversations as Titan Support
          const isAdminAsSupport =
            user.role === "ADMIN" && isSupportConversation(conversation)
          const isParticipant =
            isAdminAsSupport ||
            conversation.user1Id === user.id ||
            conversation.user2Id === user.id
          if (!isParticipant) {
            return callback({ success: false, error: "Access denied" })
          }

          const senderId = isAdminAsSupport ? SUPPORT_PARTICIPANT_ID : user.id
          const senderType = isAdminAsSupport
            ? SUPPORT_PARTICIPANT_TYPE
            : toConversationMessageSenderType(user)
          const senderName = isAdminAsSupport ? "Titan Support" : user.name
          const message = await MessageRow.create({
            conversationId: conversationID,
            senderId,
            senderType,
            senderName,
            text: text.trim(),
          })

          await ConversationRow.touch(conversationID)

          const payload = buildClientMessagePayload(message)

          io.to(`conversation:${conversationID}`).emit("message:received", {
            message: payload,
          })
          callback({ success: true, message: payload })

          // Trigger AI reply for user/seller/guest messages in support conversations
          if (
            isSupportConversation(conversation) &&
            !isAdminAsSupport &&
            user.role !== "ADMIN"
          ) {
            const aiParams: SupportChatHandlerParams = {
              io,
              conversationID,
              userMessage: text.trim(),
              actor: toActorContext(user),
            }
            enqueueSupportAIReply(aiParams)
          }
        } catch (error) {
          Logger.error(error)
          callback({ success: false, error: "Failed to send message" })
        }
      },
    )

    // Typing indicator
    socket.on("message:typing", async (data: TypingData) => {
      try {
        const { conversationID } = data
        const conversation = await ConversationRow.findById(conversationID)
        if (conversation == null) {
          return
        }

        if (user.role === "GUEST" && !isSupportConversation(conversation)) {
          return
        }

        const isParticipant =
          conversation.user1Id === user.id ||
          conversation.user2Id === user.id ||
          (user.role === "ADMIN" && isSupportConversation(conversation))
        if (!isParticipant) {
          return
        }

        socket.to(`conversation:${conversationID}`).emit("message:userTyping", {
          conversationID,
          userID: user.id,
        })
      } catch (error) {
        Logger.error(error)
      }
    })

    // Mark message as read
    socket.on("message:read", async (data: MessageReadData) => {
      try {
        const { messageID, conversationID } = data
        const conversation = await ConversationRow.findById(conversationID)
        if (conversation == null) {
          return
        }

        if (user.role === "GUEST" && !isSupportConversation(conversation)) {
          return
        }

        const isParticipant =
          conversation.user1Id === user.id ||
          conversation.user2Id === user.id ||
          (user.role === "ADMIN" && isSupportConversation(conversation))
        if (!isParticipant) {
          return
        }

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
          // Admin sees all support conversations so they can reply as Titan Support
          const rows =
            user.role === "ADMIN"
              ? await ConversationRow.listByParticipantIDs([
                  SUPPORT_PARTICIPANT_ID,
                  LEGACY_SUPPORT_PARTICIPANT_ID,
                ])
              : await ConversationRow.listForUser(user.id)
          const visibleRows =
            user.role === "GUEST"
              ? rows.filter((row) => isSupportConversation(row))
              : rows
          const orderedRows = sortConversationsPinned(visibleRows)

          const conversations = await Promise.all(
            orderedRows.map(async (conv) => {
              // Admin acts as Titan Support — show the user/seller side of each conv
              let otherPartyId: string
              let otherPartyType: "USER" | "SELLER"
              if (user.role === "ADMIN" && isSupportConversation(conv)) {
                const supportIsUser1 = isSupportParticipantID(conv.user1Id)
                otherPartyId = supportIsUser1 ? conv.user2Id : conv.user1Id
                otherPartyType = supportIsUser1
                  ? conv.user2Type
                  : conv.user1Type
              } else {
                const isUser1 = conv.user1Id === user.id
                otherPartyId = isUser1 ? conv.user2Id : conv.user1Id
                otherPartyType = isUser1 ? conv.user2Type : conv.user1Type
              }
              const normalizedOtherPartyId =
                normalizeSupportParticipantID(otherPartyId)
              const participantName = await resolveName(
                normalizedOtherPartyId,
                otherPartyType,
              )
              const lastMessage = await MessageRow.getLatest(conv.id)
              // Admin unread = messages not sent by support that have not been read
              const readerID =
                user.role === "ADMIN" && isSupportConversation(conv)
                  ? SUPPORT_PARTICIPANT_ID
                  : user.id
              const unreadCount = await MessageRow.countUnread(
                conv.id,
                readerID,
              )
              return {
                id: conv.id,
                participantIDs: normalizedOtherPartyId,
                participantName,
                lastMessage:
                  lastMessage == null
                    ? null
                    : buildClientMessagePayload(lastMessage),
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
          if (user.role === "GUEST" && !isSupportConversation(conversation)) {
            return callback({
              success: false,
              error: "Login required for non-support conversations",
            })
          }
          const isParticipant =
            conversation.user1Id === user.id ||
            conversation.user2Id === user.id ||
            (user.role === "ADMIN" && isSupportConversation(conversation))
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
          const normalizedParticipantID =
            normalizeSupportParticipantID(participantID)

          if (!participantID || !participantType) {
            return callback({
              success: false,
              error: "participantID and participantType are required",
            })
          }
          if (normalizedParticipantID === user.id) {
            return callback({
              success: false,
              error: "Cannot start a conversation with yourself",
            })
          }

          if (
            user.role === "GUEST" &&
            !isSupportTarget(normalizedParticipantID, participantType)
          ) {
            return callback({
              success: false,
              error: "Login required for non-support conversations",
            })
          }

          let conversation = await ConversationRow.findBetween(
            user.id,
            normalizedParticipantID,
          )
          const myType = user.role === "SELLER" ? "SELLER" : "USER"
          if (conversation == null) {
            conversation = await ConversationRow.create(
              user.id,
              myType,
              normalizedParticipantID,
              participantType,
            )
          }

          const participantName = await resolveName(
            normalizedParticipantID,
            participantType,
          )

          const result = {
            id: conversation.id,
            participantIDs: normalizedParticipantID,
            participantName,
            lastMessage: null,
            unreadCount: 0,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          }

          callback({ success: true, conversation: result })

          // Notify the other party so their list refreshes
          io.to(`user:${normalizedParticipantID}`).emit(
            "conversation:updated",
            {
              conversationID: conversation.id,
            },
          )
        } catch (error) {
          Logger.error(error)
          callback({ success: false, error: "Failed to start conversation" })
        }
      },
    )

    // ===== COIN RAIN HANDLERS =====

    // coin_rain:pickup — authenticated users only
    socket.on(
      "coin_rain:pickup",
      async (
        data: { coinId: string },
        callback: SocketCallback<
          | SuccessResponse<{
              coinId: string
              value: number
              newBalance: number
            }>
          | ErrorResponse
        >,
      ) => {
        if (user.role !== "USER") {
          return callback({
            success: false,
            error: "Login required to pick up coins",
          })
        }

        if (
          typeof data?.coinId !== "string" ||
          data.coinId.trim().length === 0
        ) {
          return callback({ success: false, error: "coinId is required" })
        }

        const campaign = await CoinRainRow.findActiveCampaign()
        if (campaign == null) {
          return callback({ success: false, error: "EVENT_NOT_ACTIVE" })
        }

        const result = await CoinRainTx.claimCoin(
          data.coinId.trim(),
          user.id,
          campaign.id,
        )

        if (!result.success) {
          return callback({ success: false, error: result.reason })
        }

        callback({
          success: true,
          coinId: result.coinId,
          value: result.value,
          newBalance: result.newBalance,
        })
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
  if (isSupportParticipantID(id)) return "Titan Support"
  if (id.startsWith(GUEST_ID_PREFIX)) return "Guest"
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

  const existingLegacy = await ConversationRow.findBetween(
    user.id,
    LEGACY_SUPPORT_PARTICIPANT_ID,
  )
  if (existingLegacy != null) {
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
        // Ignore duplicate/create races.
      }
    }
  }
}

function buildClientMessagePayload(message: MessageRow.MessageRow): {
  id: string
  conversationID: string
  senderID: string
  senderType: "USER" | "SELLER" | "GUEST" | "SYSTEM"
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
  senderType: "USER" | "SELLER" | "GUEST" | "SYSTEM",
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

function toConversationMessageSenderType(
  user: AuthUser,
): "USER" | "SELLER" | "GUEST" {
  if (user.role === "SELLER") {
    return "SELLER"
  }

  if (user.role === "GUEST") {
    return "GUEST"
  }

  return "USER"
}

function toActorContext(user: AuthUser): ActorContext {
  if (user.role === "USER") return { role: "USER", userId: user.id }
  if (user.role === "SELLER") return { role: "SELLER", sellerId: user.id }
  if (user.role === "ADMIN") return { role: "ADMIN", adminId: user.id }
  return { role: "GUEST" }
}

function isSupportParticipantID(value: string): boolean {
  return (
    value === SUPPORT_PARTICIPANT_ID || value === LEGACY_SUPPORT_PARTICIPANT_ID
  )
}

function normalizeSupportParticipantID(value: string): string {
  return isSupportParticipantID(value) ? SUPPORT_PARTICIPANT_ID : value
}

function isSupportConversation(
  conversation: ConversationRow.ConversationRow,
): boolean {
  return (
    isSupportParticipantID(conversation.user1Id) ||
    isSupportParticipantID(conversation.user2Id)
  )
}

function isSupportTarget(
  participantID: string,
  participantType: "USER" | "SELLER",
): boolean {
  return (
    isSupportParticipantID(participantID) &&
    participantType === SUPPORT_PARTICIPANT_TYPE
  )
}

function sortConversationsPinned(
  rows: ConversationRow.ConversationRow[],
): ConversationRow.ConversationRow[] {
  return [...rows].sort((a, b) => {
    const aSupport = isSupportConversation(a)
    const bSupport = isSupportConversation(b)

    if (aSupport !== bSupport) {
      return aSupport ? -1 : 1
    }

    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })
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
