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
  initializeSocket(handlers, token).catch((err: Error) => {
    console.error("Socket reconnection failed:", err)
  })
}

export function reconnectGuest(): void {
  disconnectSocket()
}

export function initSubscriptions() {
  window.onpopstate = () => {
    emit(ActionRoute.onUrlChange)
  }

  const authToken = AuthToken.get()
  const token =
    authToken != null ? String(authToken.accessToken.toJSON()) : undefined
  if (token != null) {
    initializeSocket(handlers, token).catch((err: Error) => {
      console.error("Socket initialization failed:", err)
    })
  }
}
