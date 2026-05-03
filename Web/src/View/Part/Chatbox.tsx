import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { State } from "../../State"
import type { ConversationID } from "../../../../Core/App/Message"
import { emit } from "../../Runtime/React"
import * as MessageAction from "../../Action/Message"
import { navigateTo, toRoute } from "../../Route"
import styles from "./Chatbox.module.css"

// ── Helpers ───────────────────────────────────────────────────────────────────

const URL_PATTERN = /(https?:\/\/[^\s]+|\/[a-z][a-z0-9/_-]*)/g

function renderMessageText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  URL_PATTERN.lastIndex = 0
  while ((match = URL_PATTERN.exec(text)) !== null) {
    const raw = match[0]
    const start = match.index
    if (start > lastIndex) parts.push(text.slice(lastIndex, start))
    parts.push(
      <a
        key={start}
        href={raw}
        className={styles.messageLink}
        target={raw.startsWith("http") ? "_blank" : "_self"}
        rel="noopener noreferrer"
      >
        {raw}
      </a>,
    )
    lastIndex = start + raw.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : [text]
}

// Hàm chuẩn bị văn bản Markdown để chắc chắn các link tương đối được render thành thẻ <a>
function prepareMarkdown(text: string): string {
  return text.replace(
    /(\/[a-z][a-z0-9/_-]*)/gi,
    (match, p1, offset, string) => {
      // Nếu phía trước là '](' tức là AI đã xuất Markdown link chuẩn -> bỏ qua không bọc nữa
      if (string.slice(offset - 2, offset) === "](") return match
      // Nếu được bọc trong [] cũng bỏ qua
      if (string[offset - 1] === "[" && string[offset + match.length] === "]")
        return match

      // Nếu chưa có, bọc lại thành chuẩn Markdown link
      return `[${match}](${match})`
    },
  )
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}

const AVATAR_COLORS = [
  "#7c3aed",
  "#ec4899",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
]
function getAvatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? "#7c3aed"
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { state: State }

export const Chatbox: React.FC<Props> = (props: Props) => {
  const { state } = props
  const {
    isOpen,
    isLoading,
    messageInput,
    conversations,
    conversationsLoading,
    currentConversationID,
    currentMessages,
    messagesLoading,
    typingUsers,
    onlineUsers,
    showNewChat,
    newChatError,
  } = state.message

  const isAdmin = state._t === "AuthAdmin"
  const isGuest = state._t === "Public" || state._t === "LoadingAuth"

  function getProfileID(): string | null {
    if (state._t === "AuthUser") return state.profile.id.unwrap()
    if (state._t === "AuthSeller") return state.profile.id.unwrap()
    if (state._t === "AuthAdmin") return state.profile.id.unwrap()
    return null
  }
  const currentUserID = getProfileID()

  const selectedConversation =
    currentConversationID != null
      ? (conversations.find(
          (c) => c.id.unwrap() === currentConversationID.unwrap(),
        ) ?? null)
      : null

  // ── Handlers ──
  const handleToggle = () => emit(MessageAction.toggleChatbox())
  const handleOpenConversation = (conversationID: ConversationID) =>
    emit(MessageAction.openConversation(conversationID))
  const handleBackToList = () => emit(MessageAction.closeConversation())
  const handleChangeMessage = (text: string) =>
    emit(MessageAction.updateMessageInput(text))
  const handleSendMessage = () => emit(MessageAction.sendMessage())
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  const handleToggleNewChat = () => {
    if (isAdmin) {
      emit(MessageAction.toggleNewChat())
    } else {
      emit(MessageAction.openSupportConversation())
    }
  }
  const handleNewChatInputChange = (text: string) =>
    emit(MessageAction.updateNewChatInput(text))
  const handleStartConversation = () => emit(MessageAction.startConversation())
  const handleNewChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleStartConversation()
    }
  }
  const handleGoToLogin = () =>
    emit(navigateTo(toRoute("Login", { redirect: null })))
  const handleGoToRegister = () => emit(navigateTo(toRoute("Register", {})))

  const isInChat = currentConversationID != null

  return (
    <div className={`${styles.chatboxContainer} ${isOpen ? styles.open : ""}`}>
      {/* ── Toggle button ── */}
      <div className={styles.chatboxToggleWrap}>
        {!isOpen && (
          <div className={styles.chatboxBubble}>
            <span className={styles.chatboxBubbleText}>I&apos;m At</span>
            <span className={styles.chatboxBubbleTail} />
          </div>
        )}
        <button
          className={`${styles.chatboxToggle} ${isOpen ? styles.chatboxToggleOpen : ""}`}
          onClick={handleToggle}
          aria-label="Toggle chatbox"
        >
          <img
            src="/assets/images/titan_ava.png"
            alt="Titan"
            className={styles.chatboxAvatarImg}
          />
        </button>
      </div>

      {isOpen && (
        <div className={styles.chatboxWindow}>
          {/* ── Window header ── */}
          <div className={styles.header}>
            {isInChat ? (
              <button
                className={styles.backBtn}
                onClick={handleBackToList}
                aria-label="Back to conversations"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            ) : (
              <div className={styles.headerIconWrap}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            )}

            <div className={styles.headerTitle}>
              {isInChat && selectedConversation != null ? (
                <>
                  <span className={styles.headerName}>
                    {selectedConversation.participantName}
                  </span>
                  {onlineUsers.has(
                    selectedConversation.participantIDs.unwrap(),
                  ) && <span className={styles.headerOnline}>● Online</span>}
                </>
              ) : (
                <span className={styles.headerName}>Messages</span>
              )}
            </div>

            <div className={styles.headerActions}>
              {!isGuest && !isInChat && (
                <button
                  className={styles.newChatBtn}
                  onClick={handleToggleNewChat}
                  title={
                    isAdmin
                      ? "Start new conversation"
                      : "Chat with Titan Support"
                  }
                  aria-label={isAdmin ? "New chat" : "Chat with support"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              )}
              <button
                className={styles.closeBtn}
                onClick={handleToggle}
                aria-label="Close chatbox"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line
                    x1="18"
                    y1="6"
                    x2="6"
                    y2="18"
                  />
                  <line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          {isGuest ? (
            <div className={styles.guestPrompt}>
              <div className={styles.guestIcon}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#guestGrad)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <defs>
                    <linearGradient
                      id="guestGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#7c3aed"
                      />
                      <stop
                        offset="100%"
                        stopColor="#ec4899"
                      />
                    </linearGradient>
                  </defs>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className={styles.guestPromptTitle}>Welcome to Titan Chat</p>
              <p className={styles.guestPromptText}>
                Sign in to chat with sellers and get support from Titan.
              </p>
              <div className={styles.guestPromptActions}>
                <button
                  className={styles.guestLoginBtn}
                  onClick={handleGoToLogin}
                >
                  Sign in
                </button>
                <button
                  className={styles.guestRegisterBtn}
                  onClick={handleGoToRegister}
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Admin: new chat panel */}
              {showNewChat && isAdmin && (
                <div className={styles.newChatPanel}>
                  <p className={styles.newChatLabel}>
                    Enter user or seller ID:
                  </p>
                  <div className={styles.newChatRow}>
                    <input
                      className={styles.newChatInput}
                      placeholder="Paste ID here…"
                      value={state.message.newChatInput}
                      onChange={(e) => handleNewChatInputChange(e.target.value)}
                      onKeyDown={handleNewChatKeyDown}
                      autoFocus
                    />
                    <button
                      className={styles.newChatStartBtn}
                      onClick={handleStartConversation}
                      disabled={isLoading || !state.message.newChatInput.trim()}
                    >
                      {isLoading ? "…" : "Start"}
                    </button>
                  </div>
                  {newChatError && (
                    <p className={styles.newChatError}>{newChatError}</p>
                  )}
                </div>
              )}

              {/* ── Conversation list (shown when no conversation selected) ── */}
              {!isInChat && (
                <div className={styles.convListPanel}>
                  {conversationsLoading && (
                    <div className={styles.loadingState}>
                      <span className={styles.loadingDots}>
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>Loading…</span>
                    </div>
                  )}
                  {!conversationsLoading && conversations.length === 0 && (
                    <div className={styles.emptyState}>
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="1.5"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>No conversations yet</p>
                    </div>
                  )}
                  <ul className={styles.convList}>
                    {conversations.map((conv) => {
                      const isOnline = onlineUsers.has(
                        conv.participantIDs.unwrap(),
                      )
                      const hasUnread = conv.unreadCount > 0
                      const color = getAvatarColor(conv.participantName)
                      const initials = getInitials(conv.participantName)
                      return (
                        <li
                          key={conv.id.unwrap()}
                          className={styles.convItem}
                          onClick={() => handleOpenConversation(conv.id)}
                        >
                          <div
                            className={styles.convAvatar}
                            style={{ background: color }}
                          >
                            {initials}
                            {isOnline && (
                              <span className={styles.convAvatarOnline} />
                            )}
                          </div>
                          <div className={styles.convMeta}>
                            <div className={styles.convRow}>
                              <span
                                className={`${styles.convName} ${hasUnread ? styles.convNameBold : ""}`}
                              >
                                {conv.participantName}
                              </span>
                              {conv.lastMessage && (
                                <span className={styles.convTime}>
                                  {formatRelativeTime(
                                    new Date(conv.lastMessage.createdAt),
                                  )}
                                </span>
                              )}
                            </div>
                            <div className={styles.convRow}>
                              <span
                                className={`${styles.convPreview} ${hasUnread ? styles.convPreviewBold : ""}`}
                              >
                                {conv.lastMessage
                                  ? conv.lastMessage.text
                                      .unwrap()
                                      .substring(0, 36) +
                                    (conv.lastMessage.text.unwrap().length > 36
                                      ? "…"
                                      : "")
                                  : "No messages yet"}
                              </span>
                              {hasUnread && (
                                <span className={styles.unreadBadge}>
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* ── Message view (shown when conversation selected) ── */}
              {isInChat && (
                <div className={styles.messagesPanel}>
                  {messagesLoading && (
                    <div className={styles.loadingState}>
                      <span className={styles.loadingDots}>
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  )}
                  {!messagesLoading && (
                    <div className={styles.messagesList}>
                      {currentMessages.length === 0 && (
                        <div className={styles.noMessages}>
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#d1d5db"
                            strokeWidth="1.5"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <p>No messages yet. Say hello! 👋</p>
                        </div>
                      )}
                      {currentMessages.map((msg) => {
                        const isSystem = msg.senderType === "SYSTEM"
                        const isMine =
                          !isSystem &&
                          currentUserID != null &&
                          msg.senderID !== "SYSTEM" &&
                          msg.senderID.unwrap() === currentUserID

                        if (isSystem) {
                          return (
                            <div
                              key={msg.id.unwrap()}
                              className={styles.systemMsg}
                            >
                              <div className={styles.systemMsgPill}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        className={styles.messageLink}
                                        target={
                                          href?.startsWith("http")
                                            ? "_blank"
                                            : "_self"
                                        }
                                        rel="noopener noreferrer"
                                      >
                                        {children}
                                      </a>
                                    ),
                                    p: ({ children }) => (
                                      <span className={styles.mdPara}>
                                        {children}
                                      </span>
                                    ),
                                  }}
                                >
                                  {prepareMarkdown(msg.text.unwrap())}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={msg.id.unwrap()}
                            className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}
                          >
                            {!isMine && (
                              <div
                                className={styles.msgAvatar}
                                style={{
                                  background: getAvatarColor(msg.senderName),
                                }}
                              >
                                {getInitials(msg.senderName)}
                              </div>
                            )}
                            <div className={styles.msgBubbleWrap}>
                              {!isMine && (
                                <span className={styles.msgSenderName}>
                                  {msg.senderName}
                                </span>
                              )}
                              <div
                                className={`${styles.msgBubble} ${isMine ? styles.msgBubbleMine : styles.msgBubbleOther}`}
                              >
                                {isMine ? (
                                  <p className={styles.messageText}>
                                    {renderMessageText(msg.text.unwrap())}
                                  </p>
                                ) : (
                                  <div className={styles.messageText}>
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        a: ({ href, children }) => (
                                          <a
                                            href={href}
                                            className={styles.messageLink}
                                            target={
                                              href?.startsWith("http")
                                                ? "_blank"
                                                : "_self"
                                            }
                                            rel="noopener noreferrer"
                                          >
                                            {children}
                                          </a>
                                        ),
                                        p: ({ children }) => (
                                          <span className={styles.mdPara}>
                                            {children}
                                          </span>
                                        ),
                                      }}
                                    >
                                      {prepareMarkdown(msg.text.unwrap())}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                              <div
                                className={`${styles.msgFooter} ${isMine ? styles.msgFooterMine : ""}`}
                              >
                                <span className={styles.timestamp}>
                                  {formatTime(new Date(msg.createdAt))}
                                </span>
                                {isMine && msg.readAt && (
                                  <span className={styles.readReceipt}>✓✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {typingUsers.size > 0 && (
                        <div className={styles.typingRow}>
                          <div
                            className={styles.msgAvatar}
                            style={{
                              background: getAvatarColor(
                                Array.from(typingUsers)[0] ?? "",
                              ),
                            }}
                          >
                            {getInitials(Array.from(typingUsers)[0] ?? "?")}
                          </div>
                          <div className={styles.typingBubble}>
                            <span className={styles.dots}>
                              <span />
                              <span />
                              <span />
                            </span>
                          </div>
                        </div>
                      )}
                      <div id="chatbox-messages-end" />
                    </div>
                  )}

                  <div className={styles.inputArea}>
                    <textarea
                      id="chatbox-input"
                      className={styles.input}
                      placeholder="Message… (Enter to send)"
                      value={messageInput}
                      onChange={(e) => handleChangeMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      rows={1}
                    />
                    <button
                      className={styles.sendBtn}
                      onClick={handleSendMessage}
                      disabled={isLoading || !messageInput.trim()}
                      aria-label="Send message"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line
                          x1="22"
                          y1="2"
                          x2="11"
                          y2="13"
                        />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Chatbox
