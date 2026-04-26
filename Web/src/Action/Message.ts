import { Action, cmd } from "../Action"
import { State, _MessageState } from "../State"
import * as Logger from "../Logger"
import {
  Message,
  Conversation,
  ConversationID,
} from "../../../Core/App/Message"
import type { SellerID } from "../../../Core/App/Seller/SellerID"
import type { UserID } from "../../../Core/App/User/UserID"
import {
  emitSendMessage,
  emitGetConversations,
  emitGetMessages,
  emitTyping,
  emitMessageRead,
  emitStartConversation,
  waitForSocketConnection,
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
    const opening = !state.message.isOpen
    if (opening && state.message.conversations.length === 0) {
      return [
        _MessageState(state, { isOpen: true }),
        cmd(loadConversationsCmd()),
      ]
    }
    return [_MessageState(state, { isOpen: !state.message.isOpen }), cmd()]
  }
}

async function loadConversationsCmd(): Promise<Action | null> {
  try {
    const isConnected = await waitForSocketConnection(20, 100)
    if (!isConnected) {
      return setConversationsError("Connection timeout. Please try again.")
    }
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
  return (state: State) => {
    async function loadConversationsCmd2(): Promise<Action | null> {
      try {
        const isConnected = await waitForSocketConnection(20, 100)
        if (!isConnected) {
          return setConversationsError("Connection timeout. Please try again.")
        }
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
      cmd(loadConversationsCmd2()),
    ]
  }
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
  return (state: State) => {
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
  }
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
  return (state: State) => {
    const { messageInput, currentConversationID, isLoading } = state.message

    if (!messageInput.trim() || currentConversationID == null || isLoading) {
      return [state, cmd()]
    }

    const conversationID = currentConversationID
    const messageText = messageInput

    async function sendMessageCmd(): Promise<Action | null> {
      try {
        const isConnected = await waitForSocketConnection(5, 50)
        if (!isConnected) {
          return setError("Connection lost. Please check your connection.")
        }
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
  }
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

export function updateNewChatInput(text: string): Action {
  return (state: State) => {
    return [
      _MessageState(state, { newChatInput: text, newChatError: null }),
      cmd(),
    ]
  }
}

export function setNewChatError(error: string | null): Action {
  return (state: State) => {
    return [_MessageState(state, { newChatError: error }), cmd()]
  }
}

export function startConversation(): Action {
  return (state: State) => {
    const { newChatInput } = state.message
    const input = newChatInput.trim()
    if (!input) {
      return [
        _MessageState(state, {
          newChatError: "Please enter a user or seller ID",
        }),
        cmd(),
      ]
    }

    async function startConversationCmd(): Promise<Action | null> {
      try {
        // Try as USER first, then SELLER
        const response = await emitStartConversation(input, "USER")
        if (response.success && response.conversation) {
          return setNewConversation(response.conversation)
        }
        const sellerResponse = await emitStartConversation(input, "SELLER")
        if (sellerResponse.success && sellerResponse.conversation) {
          return setNewConversation(sellerResponse.conversation)
        }
        return setNewChatError(response.error ?? "Could not find that user")
      } catch (err) {
        Logger.error(err)
        return setNewChatError("Failed to start conversation")
      }
    }

    return [
      _MessageState(state, { isLoading: true, newChatError: null }),
      cmd(startConversationCmd()),
    ]
  }
}

function setNewConversation(conversation: Conversation): Action {
  return (state: State) => {
    const exists = state.message.conversations.some(
      (c) => c.id.unwrap() === conversation.id.unwrap(),
    )
    const convs = exists
      ? state.message.conversations
      : [conversation, ...state.message.conversations]
    return [
      _MessageState(state, {
        conversations: convs,
        currentConversationID: conversation.id,
        isLoading: false,
        newChatInput: "",
        newChatError: null,
        showNewChat: false,
      }),
      cmd(),
    ]
  }
}

export function toggleNewChat(): Action {
  return (state: State) => {
    return [
      _MessageState(state, {
        showNewChat: !state.message.showNewChat,
        newChatInput: "",
        newChatError: null,
      }),
      cmd(),
    ]
  }
}

/**
 * Opens the chatbox and starts (or resumes) a conversation with a seller.
 * Only available to authenticated users (AuthUser).
 */
export function openConversationWithSeller(sellerID: SellerID): Action {
  return openConversationWithParticipant(
    sellerID.unwrap(),
    "SELLER",
    "Failed to open chat with seller",
  )
}

/**
 * Opens the chatbox and starts (or resumes) a conversation with a buyer.
 * Intended for authenticated sellers.
 */
export function openConversationWithUser(userID: UserID): Action {
  return openConversationWithParticipant(
    userID.unwrap(),
    "USER",
    "Failed to open chat with buyer",
  )
}

function openConversationWithParticipant(
  participantID: string,
  participantType: "USER" | "SELLER",
  fallbackError: string,
): Action {
  return (state: State) => {
    async function startConversationCmd(): Promise<Action | null> {
      try {
        const isConnected = await waitForSocketConnection(20, 100)
        if (!isConnected) {
          return setError("Connection timeout. Please try again.")
        }

        const response = await emitStartConversation(
          participantID,
          participantType,
        )
        if (response.success && response.conversation) {
          const conversation = response.conversation
          const messagesResponse = await emitGetMessages(
            conversation.id.unwrap(),
            1,
            20,
          )
          const messages =
            messagesResponse.success && messagesResponse.messages != null
              ? messagesResponse.messages
              : []
          return setConversationReady(conversation, messages)
        }
        return setError(response.error ?? fallbackError)
      } catch (err) {
        Logger.error(err)
        return setError(fallbackError)
      }
    }

    return [
      _MessageState(state, { isOpen: true, isLoading: true, error: null }),
      cmd(startConversationCmd()),
    ]
  }
}

function setConversationReady(
  conversation: Conversation,
  messages: Message[],
): Action {
  return (state: State) => {
    const exists = state.message.conversations.some(
      (c) => c.id.unwrap() === conversation.id.unwrap(),
    )
    const convs = exists
      ? state.message.conversations
      : [conversation, ...state.message.conversations]

    messages.forEach((msg) => {
      if (msg.readAt == null) {
        emitMessageRead(msg.id.unwrap(), conversation.id.unwrap())
      }
    })

    return [
      _MessageState(state, {
        conversations: convs,
        currentConversationID: conversation.id,
        currentMessages: messages,
        isLoading: false,
        messagesLoading: false,
      }),
      cmd(scrollToBottomCmd()),
    ]
  }
}
