import type {
  Message,
  Conversation,
  ConversationID,
} from "../../../Core/App/Message"
import type { State } from "../State"

export type MessageState = {
  conversations: Conversation[]
  conversationsLoading: boolean
  conversationsError: string | null
  currentConversationID: ConversationID | null
  currentMessages: Message[]
  messagesLoading: boolean
  messagesError: string | null
  messageInput: string
  isLoading: boolean
  error: string | null
  typingUsers: Set<string>
  onlineUsers: Set<string>
  isOpen: boolean
  showNewChat: boolean
  newChatInput: string
  newChatError: string | null
}

export function initMessageState(): MessageState {
  return {
    conversations: [],
    conversationsLoading: false,
    conversationsError: null,
    currentConversationID: null,
    currentMessages: [],
    messagesLoading: false,
    messagesError: null,
    messageInput: "",
    isLoading: false,
    error: null,
    typingUsers: new Set(),
    onlineUsers: new Set(),
    isOpen: false,
    showNewChat: false,
    newChatInput: "",
    newChatError: null,
  }
}

export function _MessageState(
  state: State,
  message: Partial<MessageState>,
): State {
  return { ...state, message: { ...state.message, ...message } }
}
