import { Action, cmd } from "../Action"
import { State, _MessageState, _AuthState } from "../State"
import * as Logger from "../Logger"
import {
  Message,
  Conversation,
  ConversationID,
} from "../../../Core/App/Message"
import {
  emitSendMessage,
  emitGetConversations,
  emitGetMessages,
  emitTyping,
  emitMessageRead,
} from "../Runtime/Socket"

function scrollToBottomCmd(): Promise<Action | null> {
  return new Promise((resolve) => {
    document
      .getElementById("chatbox-messages-end")
      ?.scrollIntoView({ behavior: "smooth" })
    resolve(null)
  })
}

export function toggleChatbox(): Action {
  return (state: State) => {
    return [_MessageState(state, { isOpen: !state.message.isOpen }), cmd()]
  }
}

export function updateMessageInput(text: string): Action {
  return (state: State) => {
    const trimmed = text.slice(0, 1000)
    if (state.message.currentConversationID != null) {
      emitTyping(state.message.currentConversationID.unwrap())
    }
    return [_MessageState(state, { messageInput: trimmed }), cmd()]
  }
}

export function setError(error: string | null): Action {
  return (state: State) => {
    return [_MessageState(state, { error, isLoading: false }), cmd()]
  }
}

export function loadConversations(): Action {
  return _AuthState((state) => {
    async function loadConversationsCmd(): Promise<Action | null> {
      try {
        const response = await emitGetConversations()
        if (response.success && response.conversations) {
          return setConversations(response.conversations)
        }
        return setConversationsError(
          response.error ?? "Failed to load conversations",
        )
      } catch (err) {
        Logger.error(err)
        return setConversationsError("Failed to load conversations")
      }
    }

    return [
      _MessageState(state, {
        conversationsLoading: true,
        conversationsError: null,
      }),
      cmd(loadConversationsCmd()),
    ]
  })
}

export function setConversations(conversations: Conversation[]): Action {
  return (state: State) => {
    return [
      _MessageState(state, { conversations, conversationsLoading: false }),
      cmd(),
    ]
  }
}

export function setConversationsError(error: string): Action {
  return (state: State) => {
    return [
      _MessageState(state, {
        conversationsError: error,
        conversationsLoading: false,
      }),
      cmd(),
    ]
  }
}

export function openConversation(conversationID: ConversationID): Action {
  return _AuthState((state) => {
    const id = conversationID

    async function loadMessagesCmd(): Promise<Action | null> {
      try {
        const response = await emitGetMessages(id.unwrap(), 1, 20)
        if (response.success && response.messages) {
          return setCurrentMessages(response.messages)
        }
        return setMessagesError(response.error ?? "Failed to load messages")
      } catch (err) {
        Logger.error(err)
        return setMessagesError("Failed to load messages")
      }
    }

    return [
      _MessageState(state, {
        currentConversationID: conversationID,
        messagesLoading: true,
        messagesError: null,
      }),
      cmd(loadMessagesCmd()),
    ]
  })
}

export function setCurrentMessages(messages: Message[]): Action {
  return (state: State) => {
    const convID = state.message.currentConversationID
    if (convID != null) {
      messages.forEach((msg) => {
        if (msg.readAt == null) {
          emitMessageRead(msg.id.unwrap(), convID.unwrap())
        }
      })
    }
    return [
      _MessageState(state, {
        currentMessages: messages,
        messagesLoading: false,
      }),
      cmd(scrollToBottomCmd()),
    ]
  }
}

export function setMessagesError(error: string): Action {
  return (state: State) => {
    return [
      _MessageState(state, { messagesError: error, messagesLoading: false }),
      cmd(),
    ]
  }
}

export function sendMessage(): Action {
  return _AuthState((state) => {
    const { messageInput, currentConversationID, isLoading } = state.message

    if (!messageInput.trim() || currentConversationID == null || isLoading) {
      return [state, cmd()]
    }

    const conversationID = currentConversationID
    const messageText = messageInput

    async function sendMessageCmd(): Promise<Action | null> {
      try {
        const response = await emitSendMessage(
          conversationID.unwrap(),
          messageText,
        )
        if (response.success && response.message) {
          return addMessageToList(response.message)
        }
        return setError(response.error ?? "Failed to send message")
      } catch (err) {
        Logger.error(err)
        return setError("Failed to send message")
      }
    }

    return [
      _MessageState(state, { isLoading: true, error: null }),
      cmd(sendMessageCmd()),
    ]
  })
}

export function addMessageToList(message: Message): Action {
  return (state: State) => {
    return [
      _MessageState(state, {
        currentMessages: [...state.message.currentMessages, message],
        messageInput: "",
        isLoading: false,
      }),
      cmd(scrollToBottomCmd()),
    ]
  }
}

export function receiveMessage(message: Message): Action {
  return (state: State) => {
    if (
      state.message.currentConversationID == null ||
      message.conversationID.unwrap() !==
        state.message.currentConversationID.unwrap()
    ) {
      return [state, cmd()]
    }
    emitMessageRead(message.id.unwrap(), message.conversationID.unwrap())
    return [
      _MessageState(state, {
        currentMessages: [...state.message.currentMessages, message],
      }),
      cmd(scrollToBottomCmd()),
    ]
  }
}

export function receiveTyping(userID: string): Action {
  return (state: State) => {
    const next = new Set(state.message.typingUsers)
    next.add(userID)
    return [_MessageState(state, { typingUsers: next }), cmd()]
  }
}

export function receiveUserStatus(
  userID: string,
  status: "online" | "offline",
): Action {
  return (state: State) => {
    const next = new Set(state.message.onlineUsers)
    if (status === "online") {
      next.add(userID)
    } else {
      next.delete(userID)
    }
    return [_MessageState(state, { onlineUsers: next }), cmd()]
  }
}

export function setTypingUsers(typingUsers: Set<string>): Action {
  return (state: State) => {
    return [_MessageState(state, { typingUsers }), cmd()]
  }
}

export function setOnlineUsers(onlineUsers: Set<string>): Action {
  return (state: State) => {
    return [_MessageState(state, { onlineUsers }), cmd()]
  }
}

export function setIsLoading(isLoading: boolean): Action {
  return (state: State) => {
    return [_MessageState(state, { isLoading }), cmd()]
  }
}
