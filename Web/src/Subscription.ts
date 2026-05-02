import * as ActionRoute from "./Action/Route"
import * as MessageAction from "./Action/Message"
import * as CoinRainAction from "./Action/CoinRain"
import { emit } from "./Runtime/React"
import {
  initializeSocket,
  disconnectSocket,
  type SocketEventHandlers,
} from "./Runtime/Socket"
import * as AuthToken from "./App/AuthToken"
import type { ConversationID } from "../../Core/App/Message"

const guestStorageKey = "titan_guest_id"
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getOrCreateGuestID(): string {
  const existing = localStorage.getItem(guestStorageKey)
  if (existing != null) {
    const normalized = existing.trim().toLowerCase()
    if (isValidGuestID(normalized)) {
      return normalized
    }
  }

  const id = crypto.randomUUID()
  localStorage.setItem(guestStorageKey, id)
  return id
}

function isValidGuestID(value: string): boolean {
  return uuidPattern.test(value)
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
  onConversationUpdated: (_conversationID: ConversationID) => {
    emit(MessageAction.loadConversations())
  },
  onCoinRainStart: (payload) => {
    emit(CoinRainAction.onCoinRainStart(payload))
  },
  onCoinRainEnd: (_payload) => {
    emit(CoinRainAction.onCoinRainEnd())
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
