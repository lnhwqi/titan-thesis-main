import { Server as HTTPServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"
import * as JWT from "jsonwebtoken"
import * as JD from "decoders"
import * as Logger from "./Logger"
import ENV from "./Env"

interface AuthUser {
  id: string
  role: "USER" | "SELLER" | "ADMIN"
  email: string
}

const authUserDecoder: JD.Decoder<AuthUser> = JD.object({
  id: JD.string,
  role: JD.either(
    JD.constant("USER"),
    JD.either(JD.constant("SELLER"), JD.constant("ADMIN")),
  ),
  email: JD.string,
})

function parseAuthUser(value: unknown): AuthUser | null {
  const result = authUserDecoder.decode(value)
  return result.ok ? result.value : null
}

const socketUsers = new WeakMap<Socket, AuthUser>()

type MessageSendData = { conversationID: string; text: string }
type MessageReadData = { messageID: string; conversationID: string }
type TypingData = { conversationID: string }
type MessageListData = { conversationID: string; page?: number; limit?: number }
type ConversationStartData = { participantID: string }

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

  // Authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token: unknown = socket.handshake.auth.token

    if (typeof token !== "string" || token.length === 0) {
      return next(new Error("Authentication token required"))
    }

    try {
      const decoded = JWT.verify(token, ENV.JWT_SECRET)
      const user = parseAuthUser(decoded)
      if (user == null) {
        return next(new Error("Invalid token payload"))
      }
      socketUsers.set(socket, user)
      next()
    } catch (_error) {
      next(new Error("Invalid authentication token"))
    }
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

          // TODO: Save message to database
          const message = {
            id: `msg_${Date.now()}`,
            conversationID,
            senderID: user.id,
            senderType: user.role === "USER" ? "USER" : "SELLER",
            senderName: user.email,
            text,
            readAt: null,
            createdAt: new Date(),
          }

          // Emit to all users in conversation
          io.to(`conversation:${conversationID}`).emit("message:received", {
            message,
          })

          callback({ success: true, message })
        } catch (error) {
          Logger.error(error)
          callback({
            success: false,
            error: "Failed to send message",
          })
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

        // TODO: Update message read status in database

        socket.to(`conversation:${conversationID}`).emit("message:read", {
          messageID,
          readAt: new Date(),
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
          // TODO: Fetch conversations from database for current user
          const conversations = [
            // Mock data
            {
              id: `conv_1`,
              participantIDs: "user_2",
              participantName: "John Doe",
              lastMessage: {
                id: "msg_1",
                text: "Hello!",
                senderName: "John",
                createdAt: new Date(),
                readAt: null,
              },
              unreadCount: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]

          callback({
            success: true,
            conversations,
          })
        } catch (error) {
          Logger.error(error)
          callback({
            success: false,
            error: "Failed to fetch conversations",
          })
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
          const { conversationID, page = 1, limit: _limit = 20 } = data

          // Join conversation room
          socket.join(`conversation:${conversationID}`)

          // TODO: Fetch messages from database
          const messages = [
            // Mock data
            {
              id: "msg_1",
              conversationID,
              senderID: "user_2",
              senderType: "USER",
              senderName: "John Doe",
              text: "Hello!",
              readAt: new Date(),
              createdAt: new Date(),
            },
          ]

          callback({
            success: true,
            messages,
            page,
            totalCount: 1,
          })
        } catch (error) {
          Logger.error(error)
          callback({
            success: false,
            error: "Failed to fetch messages",
          })
        }
      },
    )

    // Start new conversation
    socket.on(
      "conversation:start",
      async (
        data: ConversationStartData,
        callback: SocketCallback<
          SuccessResponse<{ conversation: unknown }> | ErrorResponse
        >,
      ) => {
        try {
          const { participantID } = data

          // TODO: Create conversation in database
          const conversation = {
            id: `conv_new_${Date.now()}`,
            participantIDs: participantID,
            participantName: "New Participant",
            lastMessage: null,
            unreadCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          callback({
            success: true,
            conversation,
          })

          // Notify other user
          io.to(`user:${participantID}`).emit("conversation:updated", {
            conversationID: conversation.id,
          })
        } catch (error) {
          Logger.error(error)
          callback({
            success: false,
            error: "Failed to start conversation",
          })
        }
      },
    )

    // ===== DISCONNECT HANDLER =====
    socket.on("disconnect", () => {
      Logger.log(`User disconnected: ${user.email} (${socket.id})`)

      // Broadcast user is offline
      socket.broadcast.emit("user:statusChanged", {
        userID: user.id,
        status: "offline",
      })
    })
  })

  return io
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
