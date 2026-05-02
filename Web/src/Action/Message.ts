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
  emitStartConversation,
} from "../Runtime/Socket"

const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"
const LEGACY_SUPPORT_PARTICIPANT_ID = "00000000-0000-0000-0000-000000000001"
const SUPPORT_PARTICIPANT_TYPE: "SELLER" = "SELLER"

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
    if (opening) {
      return [
        _MessageState(state, {
          isOpen: true,
          showNewChat: false,
          // Always start at the conversation list
          currentConversationID: null,
          currentMessages: [],
          conversationsLoading: true,
          conversationsError: null,
        }),
        cmd(loadConversationsCmd()),
      ]
    }
    return [_MessageState(state, { isOpen: false }), cmd()]
  }
}

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

async function loadMessagesForConversationCmd(
  conversationID: ConversationID,
): Promise<Action | null> {
  try {
    const response = await emitGetMessages(conversationID.unwrap(), 1, 20)
    if (response.success && response.messages) {
      return setCurrentMessages(response.messages)
    }
    return setMessagesError(response.error ?? "Failed to load messages")
  } catch (err) {
    Logger.error(err)
    return setMessagesError("Failed to load messages")
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
    const sorted = sortConversationsPinned(conversations)
    // Keep the currently open conversation selected if it still exists in the refreshed list.
    // Do NOT auto-select when no conversation is chosen — the new single-panel layout shows
    // the conversation list first; users tap to enter a specific conversation.
    const currentID = state.message.currentConversationID
    const stillExists =
      currentID != null &&
      sorted.some((c) => c.id.unwrap() === currentID.unwrap())
    if (!stillExists && currentID != null) {
      // The selected conversation disappeared (deleted/filtered out) — fall back to list.
      return [
        _MessageState(state, {
          conversations: sorted,
          conversationsLoading: false,
          currentConversationID: null,
          currentMessages: [],
        }),
        cmd(),
      ]
    }
    return [
      _MessageState(state, {
        conversations: sorted,
        conversationsLoading: false,
      }),
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

export function closeConversation(): Action {
  return (state: State) => [
    _MessageState(state, {
      currentConversationID: null,
      currentMessages: [],
      messagesError: null,
    }),
    cmd(),
  ]
}

export function openConversation(conversationID: ConversationID): Action {
  return _AuthState((state) => {
    return [
      _MessageState(state, {
        currentConversationID: conversationID,
        messagesLoading: true,
        messagesError: null,
      }),
      cmd(loadMessagesForConversationCmd(conversationID)),
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
        if (response.success) {
          // The server broadcasts message:received to all room members
          // including the sender — receiveMessage() will add it to the list.
          // Only clear loading state here; do NOT add the message directly
          // or it will appear twice.
          return clearSendingState()
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

export function clearSendingState(): Action {
  return (state: State) => {
    return [
      _MessageState(state, { messageInput: "", isLoading: false }),
      cmd(),
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
    return [
      _MessageState(state, { newChatError: error, isLoading: false }),
      cmd(),
    ]
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

export function openConversationWithUser(userID: { unwrap(): string }): Action {
  return openConversationWithParticipant(userID.unwrap(), "USER")
}

export function openSupportConversation(): Action {
  return openConversationWithParticipant(
    SUPPORT_PARTICIPANT_ID,
    SUPPORT_PARTICIPANT_TYPE,
  )
}

export function openConversationWithSeller(sellerID: {
  unwrap(): string
}): Action {
  return openConversationWithParticipant(sellerID.unwrap(), "SELLER")
}

function openConversationWithParticipant(
  participantID: string,
  participantType: "USER" | "SELLER",
): Action {
  return _AuthState((state) => {
    async function startConversationCmd(): Promise<Action | null> {
      try {
        const response = await emitStartConversation(
          participantID,
          participantType,
        )
        if (response.success && response.conversation) {
          return setNewConversation(response.conversation)
        }

        return setParticipantOpenError(
          response.error ?? "Failed to start conversation",
        )
      } catch (err) {
        Logger.error(err)
        return setParticipantOpenError("Failed to start conversation")
      }
    }

    return [
      _MessageState(state, {
        isLoading: true,
        error: null,
        newChatError: null,
        isOpen: true,
      }),
      cmd(startConversationCmd()),
    ]
  })
}

function setParticipantOpenError(error: string): Action {
  return (state: State) => {
    return [
      _MessageState(state, {
        isLoading: false,
        error,
        newChatError: error,
        showNewChat: true,
        isOpen: true,
      }),
      cmd(),
    ]
  }
}

function setNewConversation(conversation: Conversation): Action {
  return (state: State) => {
    const exists = state.message.conversations.some(
      (c) => c.id.unwrap() === conversation.id.unwrap(),
    )
    const convs = exists
      ? sortConversationsPinned(state.message.conversations)
      : sortConversationsPinned([conversation, ...state.message.conversations])
    return [
      _MessageState(state, {
        conversations: convs,
        currentConversationID: conversation.id,
        currentMessages: [],
        messagesLoading: true,
        messagesError: null,
        isLoading: false,
        error: null,
        isOpen: true,
        newChatInput: "",
        newChatError: null,
        showNewChat: false,
      }),
      // Load messages AND refresh the full conversations list in the background.
      // Running loadConversationsCmd() HERE (after the conversation exists on the server)
      // avoids a race condition where the parallel-fetched list would not yet contain
      // the newly created conversation, causing setConversations to reset currentConversationID.
      cmd(
        loadMessagesForConversationCmd(conversation.id),
        loadConversationsCmd(),
      ),
    ]
  }
}

function sortConversationsPinned(
  conversations: Conversation[],
): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aSupport = isSupportConversation(a)
    const bSupport = isSupportConversation(b)

    if (aSupport !== bSupport) {
      return aSupport ? -1 : 1
    }

    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })
}

function isSupportConversation(conversation: Conversation): boolean {
  const participantID = conversation.participantIDs.unwrap()

  return (
    participantID === SUPPORT_PARTICIPANT_ID ||
    participantID === LEGACY_SUPPORT_PARTICIPANT_ID ||
    conversation.participantName === "Titan Support"
  )
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
