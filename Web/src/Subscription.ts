import * as ActionRoute from "./Action/Route"
import * as MessageAction from "./Action/Message"
import { emit } from "./Runtime/React"
import { initializeSocket, type SocketEventHandlers } from "./Runtime/Socket"
import * as AuthToken from "./App/AuthToken"

export function initSubscriptions() {
  window.onpopstate = () => {
    emit(ActionRoute.onUrlChange)
  }

  const authToken = AuthToken.get()
  const token =
    authToken != null ? String(authToken.accessToken.toJSON()) : undefined

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
  }

  initializeSocket(handlers, token).catch((err: Error) => {
    console.error("Socket initialization failed:", err)
  })
}
