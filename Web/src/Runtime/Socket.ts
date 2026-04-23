import { io, Socket } from "socket.io-client"
import type {
  Message,
  Conversation,
  ConversationID,
} from "../../../Core/App/Message"
import * as Logger from "../Logger"

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
}

/**
 * Initialize Socket.IO connection and event listeners
 */
export function initializeSocket(
  handlers: SocketEventHandlers,
  authToken?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket && socket.connected) {
      resolve()
      return
    }

    try {
      const socketUrl =
        process.env.REACT_APP_SOCKET_URL || "http://localhost:3001"

      socket = io(socketUrl, {
        auth: {
          token: authToken,
        },
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
 * Setup all message-related event listeners
 */
function setupMessageListeners(
  socket: Socket,
  handlers: SocketEventHandlers,
): void {
  socket.on("message:received", (data: { message: Message }) => {
    handlers.onMessageReceived(data.message)
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

  socket.on("conversation:updated", (_data: { conversationID: string }) => {
    // no-op: handled via message receive
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
      (response: { success: boolean; message?: Message; error?: string }) => {
        resolve(response)
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
      (response: {
        success: boolean
        conversations?: Conversation[]
        error?: string
      }) => {
        resolve(response)
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
      (response: {
        success: boolean
        messages?: Message[]
        page?: number
        totalCount?: number
        error?: string
      }) => {
        resolve(response)
      },
    )
  })
}

/**
 * Start new conversation
 */
export function emitStartConversation(participantID: string): Promise<{
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
      { participantID },
      (response: {
        success: boolean
        conversation?: Conversation
        error?: string
      }) => {
        resolve(response)
      },
    )
  })
}
