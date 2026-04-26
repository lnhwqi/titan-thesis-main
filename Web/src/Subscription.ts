import * as ActionRoute from "./Action/Route"
import * as MessageAction from "./Action/Message"
import { emit } from "./Runtime/React"
import {
  initializeSocket,
  disconnectSocket,
  type SocketEventHandlers,
} from "./Runtime/Socket"
import * as AuthToken from "./App/AuthToken"

function getOrCreateGuestID(): string {
  const key = "titan_guest_id"
  const existing = localStorage.getItem(key)
  if (existing != null && existing.length > 0) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

const handlers: SocketEventHandlers = {
  onMessageReceived: (message) => {
    emit(MessageAction.receiveMessage(message))
  },
  onUserTyping: (data) => {
    emit(MessageAction.receiveTyping(data.userID))
  },
  onUserStatusChanged: (data) => {
    emit(MessageAction.receiveUserStatus(data.userID, data.status))
  },
  onConversationUpdated: (_conversationID) => {
    emit(MessageAction.loadConversations())
  },
}

export function reconnectAuthenticated(token: string): void {
  disconnectSocket()
  initializeSocket(handlers, token, undefined).catch((err: Error) => {
    console.error("Socket reconnection failed:", err)
  })
}

export function reconnectGuest(): void {
  disconnectSocket()
  const guestID = getOrCreateGuestID()
  initializeSocket(handlers, undefined, guestID).catch((err: Error) => {
    console.error("Socket reconnection failed:", err)
  })
}

export function initSubscriptions() {
  window.onpopstate = () => {
    emit(ActionRoute.onUrlChange)
  }

  const authToken = AuthToken.get()
  const token =
    authToken != null ? String(authToken.accessToken.toJSON()) : undefined
  const guestID = token == null ? getOrCreateGuestID() : undefined

  initializeSocket(handlers, token, guestID).catch((err: Error) => {
    console.error("Socket initialization failed:", err)
  })
}
