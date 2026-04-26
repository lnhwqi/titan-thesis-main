import { io, Socket } from "socket.io-client"
import type {
  Message,
  Conversation,
  ConversationID,
} from "../../../Core/App/Message"
import { conversationDecoder, messageDecoder } from "../../../Core/App/Message"
import * as JD from "decoders"
import * as Logger from "../Logger"
import Env from "../Env"

let socket: Socket | null = null

/**
 * Socket event handler types
 */
export type SocketEventHandlers = {
  onMessageReceived: (message: Message) => void
  onUserTyping: (data: {
    conversationID: ConversationID
    userID: string
  }) => void
  onUserStatusChanged: (data: {
    userID: string
    status: "online" | "offline"
  }) => void
  onConversationUpdated: (conversationID: string) => void
}

/**
 * Initialize Socket.IO connection and event listeners.
 * Pass authToken for logged-in users, guestID for guests.
 */
export function initializeSocket(
  handlers: SocketEventHandlers,
  authToken?: string,
  guestID?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket && socket.connected) {
      resolve()
      return
    }

    try {
      const socketUrl = `http://${Env.API_HOST}`

      socket = io(socketUrl, {
        auth: authToken ? { token: authToken } : { guestID },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ["websocket", "polling"],
      })

      // Connection established
      socket.on("connect", () => {
        resolve()
      })

      // Connection error
      socket.on("connect_error", (err: Error) => {
        reject(err)
      })

      // Setup message event listeners
      setupMessageListeners(socket, handlers)
    } catch (err) {
      Logger.error(err)
      reject(err)
    }
  })
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Get socket instance
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Wait for socket to be connected (with retries)
 */
export async function waitForSocketConnection(
  maxRetries: number = 10,
  retryDelay: number = 100,
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (socket && socket.connected) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay))
  }
  return false
}

/**
 * Setup all message-related event listeners
 */
function setupMessageListeners(
  socket: Socket,
  handlers: SocketEventHandlers,
): void {
  socket.on("message:received", (data: { message: unknown }) => {
    const decoded = messageDecoder.decode(data.message)
    if (decoded.ok) {
      handlers.onMessageReceived(decoded.value)
    }
  })

  socket.on(
    "message:userTyping",
    (data: { conversationID: ConversationID; userID: string }) => {
      handlers.onUserTyping(data)
    },
  )

  socket.on("message:userStoppedTyping", (_data: { userID: string }) => {
    // no-op: typing timeout handled client-side
  })

  socket.on(
    "user:statusChanged",
    (data: { userID: string; status: "online" | "offline" }) => {
      handlers.onUserStatusChanged(data)
    },
  )

  socket.on("message:read", (_data: { messageID: string; readAt: Date }) => {
    // no-op: read receipts handled via state
  })

  socket.on("conversation:updated", (data: { conversationID: string }) => {
    handlers.onConversationUpdated(data.conversationID)
  })

  socket.on("error", (err: Error) => {
    Logger.error(err)
  })

  socket.on("disconnect", (reason: string) => {
    if (reason === "io server disconnect") {
      socket?.connect()
    }
  })
}

/**
 * Send a message
 */
export function emitSendMessage(
  conversationID: string,
  text: string,
): Promise<{ success: boolean; message?: Message; error?: string }> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: "Socket not connected" })
      return
    }

    socket.emit(
      "message:send",
      { conversationID, text },
      (raw: { success: boolean; message?: unknown; error?: string }) => {
        if (raw.success && raw.message != null) {
          const decoded = messageDecoder.decode(raw.message)
          resolve(
            decoded.ok
              ? { success: true, message: decoded.value }
              : { success: false, error: "Invalid message response" },
          )
        } else {
          resolve({ success: raw.success, error: raw.error })
        }
      },
    )
  })
}

/**
 * Emit typing indicator
 */
export function emitTyping(conversationID: string): void {
  if (!socket || !socket.connected) return

  socket.emit("message:typing", { conversationID })
}

/**
 * Emit message read receipt
 */
export function emitMessageRead(
  messageID: string,
  conversationID: string,
): void {
  if (!socket || !socket.connected) return

  socket.emit("message:read", { messageID, conversationID })
}

/**
 * Request conversations list
 */
export function emitGetConversations(): Promise<{
  success: boolean
  conversations?: Conversation[]
  error?: string
}> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: "Socket not connected" })
      return
    }

    socket.emit(
      "conversation:list",
      {},
      (raw: {
        success: boolean
        conversations?: unknown[]
        error?: string
      }) => {
        if (raw.success && raw.conversations != null) {
          const decoded = JD.array(conversationDecoder).decode(
            raw.conversations,
          )
          resolve(
            decoded.ok
              ? { success: true, conversations: decoded.value }
              : { success: false, error: "Invalid conversations response" },
          )
        } else {
          resolve({ success: raw.success, error: raw.error })
        }
      },
    )
  })
}

/**
 * Request messages for conversation
 */
export function emitGetMessages(
  conversationID: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  success: boolean
  messages?: Message[]
  page?: number
  totalCount?: number
  error?: string
}> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: "Socket not connected" })
      return
    }

    socket.emit(
      "message:list",
      { conversationID, page, limit },
      (raw: {
        success: boolean
        messages?: unknown[]
        page?: number
        totalCount?: number
        error?: string
      }) => {
        if (raw.success && raw.messages != null) {
          const decoded = JD.array(messageDecoder).decode(raw.messages)
          resolve(
            decoded.ok
              ? {
                  success: true,
                  messages: decoded.value,
                  page: raw.page,
                  totalCount: raw.totalCount,
                }
              : { success: false, error: "Invalid messages response" },
          )
        } else {
          resolve({ success: raw.success, error: raw.error })
        }
      },
    )
  })
}

/**
 * Start new conversation
 */
export function emitStartConversation(
  participantID: string,
  participantType: "USER" | "SELLER" = "USER",
): Promise<{
  success: boolean
  conversation?: Conversation
  error?: string
}> {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: "Socket not connected" })
      return
    }

    socket.emit(
      "conversation:start",
      { participantID, participantType },
      (raw: { success: boolean; conversation?: unknown; error?: string }) => {
        if (raw.success && raw.conversation != null) {
          const decoded = conversationDecoder.decode(raw.conversation)
          resolve(
            decoded.ok
              ? { success: true, conversation: decoded.value }
              : { success: false, error: "Invalid conversation response" },
          )
        } else {
          resolve({ success: raw.success, error: raw.error })
        }
      },
    )
  })
}
