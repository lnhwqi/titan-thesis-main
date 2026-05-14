import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { State, currentActorId, isAdmin as isAdminState } from "../../State"
import type { ConversationID } from "../../../../Core/App/Message"
import { emit } from "../../Runtime/React"
import * as MessageAction from "../../Action/Message"
import { navigateTo, toRoute } from "../../Route"
import * as AuthToken from "../../App/AuthToken"
import { css, keyframes } from "@emotion/css"

// ── Color constants ───────────────────────────────────────────────────────────
const BRAND = "#00529c"
const SECONDARY = "#ed1c24"
const ACCENT_SOFT = "rgba(0, 82, 156, 0.05)"
const BORDER = "rgba(0, 82, 156, 0.14)"
const PURPLE = "#7c3aed"
const PINK = "#ec4899"

// ── Keyframes ─────────────────────────────────────────────────────────────────
const floatY = keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-7px)" },
})
const glowPulse = keyframes({
  "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
  "50%": { opacity: "1", transform: "scale(1.08)" },
})
const slideUp = keyframes({
  from: { opacity: "0", transform: "translateY(16px) scale(0.97)" },
  to: { opacity: "1", transform: "translateY(0) scale(1)" },
})
const bounce = keyframes({
  "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.5" },
  "40%": { transform: "translateY(-4px)", opacity: "1" },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const URL_PATTERN = /(https?:\/\/[^\s]+|\/[a-z][a-z0-9/_-]*)/g

function renderMessageText(text: string): React.ReactNode[] {
  const matches = Array.from(text.matchAll(new RegExp(URL_PATTERN.source, "g")))
  if (matches.length === 0) {
    return [text]
  }

  const [nodes, cursor] = matches.reduce<readonly [React.ReactNode[], number]>(
    ([acc, lastIndex], match) => {
      const raw = match[0]
      const start = match.index ?? 0
      const plainText = start > lastIndex ? [text.slice(lastIndex, start)] : []

      const link = (
        <a
          key={`${start}-${raw}`}
          href={raw}
          className={styles.messageLink}
          target={raw.startsWith("http") ? "_blank" : "_self"}
          rel="noopener noreferrer"
        >
          {raw}
        </a>
      )

      return [[...acc, ...plainText, link], start + raw.length]
    },
    [[], 0],
  )

  return cursor < text.length ? [...nodes, text.slice(cursor)] : nodes
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
  const hash = Array.from(name).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0,
    0,
  )
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "#7c3aed"
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

function renderMarkdownMessage(text: string): React.ReactElement {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            className={styles.messageLink}
            target={href?.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        p: ({ children }) => <span className={styles.mdPara}>{children}</span>,
      }}
    >
      {prepareMarkdown(text)}
    </ReactMarkdown>
  )
}

type ChatMessage = State["message"]["currentMessages"][number]

type MessageItemProps = {
  message: ChatMessage
  currentUserID: string | null
}

function MessageItem(props: MessageItemProps): React.ReactElement {
  const { message, currentUserID } = props
  const isSystem = message.senderType === "SYSTEM"
  const isMine =
    !isSystem &&
    currentUserID != null &&
    message.senderID !== "SYSTEM" &&
    message.senderID.unwrap() === currentUserID

  if (isSystem) {
    return (
      <div className={styles.systemMsg}>
        <div className={styles.systemMsgPill}>
          {renderMarkdownMessage(message.text.unwrap())}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}
    >
      {!isMine && (
        <div
          className={styles.msgAvatar}
          style={{
            background: getAvatarColor(message.senderName),
          }}
        >
          {getInitials(message.senderName)}
        </div>
      )}
      <div className={styles.msgBubbleWrap}>
        {!isMine && (
          <span className={styles.msgSenderName}>{message.senderName}</span>
        )}
        <div
          className={`${styles.msgBubble} ${isMine ? styles.msgBubbleMine : styles.msgBubbleOther}`}
        >
          {isMine ? (
            <p className={`${styles.messageText} ${styles.messageTextMine}`}>
              {renderMessageText(message.text.unwrap())}
            </p>
          ) : (
            <div className={styles.messageText}>
              {renderMarkdownMessage(message.text.unwrap())}
            </div>
          )}
        </div>
        <div
          className={`${styles.msgFooter} ${isMine ? styles.msgFooterMine : ""}`}
        >
          <span className={styles.timestamp}>
            {formatTime(new Date(message.createdAt))}
          </span>
          {isMine && message.readAt && (
            <span className={styles.readReceipt}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
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

  const isAdmin = isAdminState(state)
  const isGuest = AuthToken.get() == null && !("profile" in state)

  const currentUserID = currentActorId(state)

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
  const firstTypingUser = typingUsers.values().next().value ?? null

  return (
    <div className={styles.chatboxContainer}>
      {/* ── Toggle button ── */}
      <div className={styles.chatboxToggleWrap}>
        {!isOpen && (
          <div className={styles.chatboxBubble}>
            <span className={styles.chatboxBubbleText}>Chatbox Supporting</span>
            <span className={styles.chatboxBubbleTail} />
          </div>
        )}
        <button
          className={`${styles.chatboxToggle} ${isOpen ? styles.chatboxToggleOpen : styles.chatboxToggleIdle}`}
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
                  className={styles.headerActionBtn}
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
                className={styles.headerActionBtn}
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
                      {firstTypingUser != null && (
                        <div className={styles.typingRow}>
                          <div
                            className={styles.msgAvatar}
                            style={{
                              background: getAvatarColor(firstTypingUser),
                            }}
                          >
                            {getInitials(firstTypingUser)}
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
                      {currentMessages.toReversed().map((message) => (
                        <MessageItem
                          key={message.id.unwrap()}
                          message={message}
                          currentUserID={currentUserID}
                        />
                      ))}
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
// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  chatboxContainer: css({
    position: "fixed",
    bottom: "max(10px, env(safe-area-inset-bottom, 0px) + 8px)",
    right: "clamp(8px, 2.6vw, 24px)",
    zIndex: 2147483000,
    isolation: "isolate",
    maxWidth: "calc(100dvw - 12px)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "@media (max-width: 640px)": {
      bottom: "max(6px, env(safe-area-inset-bottom, 0px) + 6px)",
      right: "6px",
    },
  }),
  chatboxToggleWrap: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    position: "relative",
    zIndex: 2,
  }),
  chatboxBubble: css({
    position: "relative",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(0,82,156,0.16)",
    borderRadius: "14px",
    padding: "6px 14px",
    boxShadow: "0 10px 24px rgba(0,82,156,0.12)",
    whiteSpace: "nowrap",
    animation: `${floatY} 4s ease-in-out infinite`,
  }),
  chatboxBubbleText: css({
    fontSize: "12px",
    fontWeight: 700,
    background: `linear-gradient(90deg, ${BRAND}, ${SECONDARY})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }),
  chatboxBubbleTail: css({
    position: "absolute",
    bottom: "-7px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "12px",
    height: "8px",
    background: "rgba(255,255,255,0.95)",
    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
  }),
  chatboxToggle: css({
    width: "clamp(54px, 8vw, 64px)",
    height: "clamp(54px, 8vw, 64px)",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${BRAND}, ${SECONDARY})`,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,82,156,0.24)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
    position: "relative",
    overflow: "hidden",
    "::before": {
      content: '""',
      position: "absolute",
      inset: "-4px",
      borderRadius: "50%",
      background:
        "linear-gradient(135deg,rgba(0,82,156,0.18),rgba(237,28,36,0.14))",
      filter: "blur(8px)",
      zIndex: -1,
      animation: `${glowPulse} 2.5s ease-in-out infinite`,
    },
    "&:active": { transform: "scale(0.94)" },
  }),
  chatboxToggleIdle: css({
    animation: `${floatY} 3.5s ease-in-out infinite`,
    "&:hover": {
      transform: "scale(1.08) translateY(-2px)",
      boxShadow: "0 10px 28px rgba(0,82,156,0.3)",
    },
  }),
  chatboxToggleOpen: css({
    animation: "none",
    boxShadow: "0 0 0 3px rgba(0,82,156,0.2),0 4px 20px rgba(0,82,156,0.2)",
    transform: "scale(0.95)",
  }),
  chatboxAvatarImg: css({
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    objectPosition: "center top",
  }),
  chatboxWindow: css({
    position: "absolute",
    bottom: "74px",
    right: "0",
    width: "min(400px, calc(100dvw - 16px))",
    height: "min(76dvh, 620px)",
    maxHeight: "calc(100dvh - 88px)",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 48px rgba(0,0,0,0.18),0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: `${slideUp} 0.25s cubic-bezier(0.34,1.56,0.64,1)`,
    border: "1px solid rgba(0,82,156,0.2)",
    outline: "1px solid rgba(0,82,156,0.08)",
    zIndex: 3,
    "@media (max-width: 900px)": {
      width: "min(430px, calc(100dvw - 12px))",
      height: "min(80dvh, calc(100dvh - 84px))",
    },
    "@media (max-width: 640px)": {
      width: "calc(100dvw - 12px)",
      right: "0",
      height: "min(84dvh, calc(100dvh - 74px))",
      bottom: "66px",
      borderRadius: "14px",
    },
  }),
  header: css({
    padding: "12px 14px",
    background: `linear-gradient(135deg, ${BRAND} 0%, ${SECONDARY} 100%)`,
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
    "@media (max-width: 640px)": {
      padding: "10px 12px",
      gap: "8px",
    },
  }),
  backBtn: css({
    background: "rgba(255,255,255,0.18)",
    border: "none",
    color: "white",
    cursor: "pointer",
    borderRadius: "8px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s",
    "&:hover": { background: "rgba(255,255,255,0.3)" },
  }),
  headerIconWrap: css({
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    opacity: 0.85,
  }),
  headerTitle: css({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  }),
  headerName: css({
    fontSize: "15px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  headerOnline: css({
    fontSize: "11px",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 500,
  }),
  headerActions: css({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  }),
  headerActionBtn: css({
    background: "rgba(255,255,255,0.18)",
    border: "none",
    color: "white",
    cursor: "pointer",
    borderRadius: "8px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    "&:hover": { background: "rgba(255,255,255,0.32)" },
  }),
  newChatPanel: css({
    padding: "10px 14px",
    background: ACCENT_SOFT,
    borderBottom: "1px solid rgba(0,82,156,0.12)",
    flexShrink: 0,
  }),
  newChatLabel: css({
    margin: "0 0 6px 0",
    fontSize: "11px",
    color: BRAND,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  }),
  newChatRow: css({
    display: "flex",
    gap: "6px",
    "@media (max-width: 460px)": {
      flexDirection: "column",
    },
  }),
  newChatInput: css({
    flex: 1,
    padding: "7px 10px",
    border: "1px solid rgba(0,82,156,0.24)",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1a1a1a",
    background: "#ffffff",
    outline: "none",
    transition: "border-color 0.2s",
    "&:focus": {
      borderColor: "#3375b0",
      boxShadow: "0 0 0 3px rgba(0,82,156,0.1)",
    },
  }),
  newChatStartBtn: css({
    padding: "7px 14px",
    background: `linear-gradient(135deg, ${BRAND}, ${SECONDARY})`,
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
    "@media (max-width: 460px)": {
      width: "100%",
      minHeight: "36px",
    },
    "&:disabled": { opacity: 0.45, cursor: "not-allowed" },
  }),
  newChatError: css({
    margin: "5px 0 0 0",
    fontSize: "11px",
    color: "#dc2626",
  }),
  guestPrompt: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: "32px 28px",
    textAlign: "center",
    gap: "14px",
  }),
  guestIcon: css({
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: ACCENT_SOFT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  guestPromptTitle: css({
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
    color: "#1a1a1a",
  }),
  guestPromptText: css({
    margin: 0,
    fontSize: "13px",
    color: "#4d4d4d",
    lineHeight: 1.55,
  }),
  guestPromptActions: css({
    display: "flex",
    gap: "10px",
    marginTop: "4px",
    "@media (max-width: 460px)": {
      width: "100%",
      flexDirection: "column",
    },
  }),
  guestLoginBtn: css({
    padding: "10px 28px",
    background: `linear-gradient(135deg, ${BRAND}, ${SECONDARY})`,
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
    "@media (max-width: 460px)": {
      width: "100%",
    },
    "&:hover": { opacity: 0.9, transform: "translateY(-1px)" },
  }),
  guestRegisterBtn: css({
    padding: "10px 28px",
    background: "#ffffff",
    color: BRAND,
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.15s",
    "@media (max-width: 460px)": {
      width: "100%",
    },
    "&:hover": { background: ACCENT_SOFT, transform: "translateY(-1px)" },
  }),
  loadingState: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "28px",
    color: "#9ca3af",
    fontSize: "13px",
    flex: 1,
  }),
  loadingDots: css({
    display: "flex",
    gap: "4px",
    "& span": {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${BRAND}, ${SECONDARY})`,
      animation: `${bounce} 1.2s infinite`,
    },
    "& span:nth-child(2)": { animationDelay: "0.18s" },
    "& span:nth-child(3)": { animationDelay: "0.36s" },
  }),
  emptyState: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "48px 24px",
    color: "#9ca3af",
    fontSize: "13px",
    textAlign: "center",
    flex: 1,
    "& p": { margin: 0 },
  }),
  convListPanel: css({
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  }),
  convList: css({ listStyle: "none", padding: "6px 0", margin: 0 }),
  convItem: css({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    "&:hover": { background: ACCENT_SOFT },
  }),
  convAvatar: css({
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 800,
    color: "white",
    flexShrink: 0,
    position: "relative",
    letterSpacing: "0.01em",
  }),
  convAvatarOnline: css({
    position: "absolute",
    bottom: "1px",
    right: "1px",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    background: "#10b981",
    border: "2px solid white",
  }),
  convMeta: css({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  }),
  convRow: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
  }),
  convName: css({
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  convNameBold: css({ fontWeight: 700, color: "#111827" }),
  convTime: css({ fontSize: "11px", color: "#9ca3af", flexShrink: 0 }),
  convPreview: css({
    fontSize: "12px",
    color: "#9ca3af",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  }),
  convPreviewBold: css({ color: "#374151", fontWeight: 500 }),
  unreadBadge: css({
    background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
    color: "white",
    borderRadius: "10px",
    padding: "2px 7px",
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
    minWidth: "20px",
    textAlign: "center",
    boxShadow: "0 2px 6px rgba(124,58,237,0.35)",
  }),
  messagesPanel: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }),
  messagesList: css({
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column-reverse",
    gap: "4px",
    "@media (max-width: 640px)": {
      padding: "12px 10px",
    },
  }),
  noMessages: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    flex: 1,
    padding: "48px 24px",
    color: "#9ca3af",
    fontSize: "13px",
    textAlign: "center",
    margin: "auto",
    "& p": { margin: 0 },
  }),
  msgRow: css({
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    maxWidth: "92%",
    marginBottom: "4px",
    "@media (max-width: 640px)": {
      maxWidth: "96%",
    },
  }),
  msgRowMine: css({ alignSelf: "flex-end", flexDirection: "row-reverse" }),
  msgRowOther: css({ alignSelf: "flex-start" }),
  msgAvatar: css({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 800,
    color: "white",
    flexShrink: 0,
  }),
  msgBubbleWrap: css({
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  }),
  msgSenderName: css({
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    paddingLeft: "2px",
  }),
  msgBubble: css({
    padding: "9px 13px",
    borderRadius: "16px",
    maxWidth: "100%",
    wordWrap: "break-word",
  }),
  msgBubbleMine: css({
    background: `linear-gradient(135deg, ${PURPLE}, #a855f7)`,
    color: "white",
    borderBottomRightRadius: "4px",
    boxShadow: "0 2px 10px rgba(124,58,237,0.28)",
  }),
  msgBubbleOther: css({
    background: "#f0eeff",
    color: "#1f2937",
    borderBottomLeftRadius: "4px",
  }),
  msgFooter: css({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    paddingLeft: "2px",
  }),
  msgFooterMine: css({
    flexDirection: "row-reverse",
    paddingLeft: 0,
    paddingRight: "2px",
  }),
  timestamp: css({ fontSize: "10px", color: "#9ca3af" }),
  readReceipt: css({ fontSize: "11px", color: PURPLE, fontWeight: 700 }),
  systemMsg: css({
    display: "flex",
    justifyContent: "center",
    padding: "4px 0",
    margin: "6px 0",
  }),
  systemMsgPill: css({
    background: "rgba(124,58,237,0.08)",
    color: "#6d28d9",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "12px",
    padding: "5px 14px",
    maxWidth: "90%",
    textAlign: "center",
    lineHeight: 1.4,
    border: "1px solid rgba(124,58,237,0.18)",
    "& ul, & ol": { margin: "0.25em 0 0.25em 1.2em", padding: 0 },
    "& li": { marginBottom: "0.15em" },
    "& strong": { fontWeight: 600 },
    "& em": { fontStyle: "italic" },
    "& code": {
      fontFamily: 'ui-monospace,"Cascadia Code","Fira Code",monospace',
      fontSize: "0.85em",
      background: "rgba(124,58,237,0.1)",
      borderRadius: "3px",
      padding: "0.1em 0.35em",
    },
  }),
  typingRow: css({
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    alignSelf: "flex-start",
    marginBottom: "4px",
  }),
  typingBubble: css({
    background: "#f0eeff",
    borderRadius: "16px",
    borderBottomLeftRadius: "4px",
    padding: "10px 14px",
  }),
  dots: css({
    display: "flex",
    gap: "3px",
    alignItems: "center",
    "& span": {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
      animation: `${bounce} 1.2s infinite`,
    },
    "& span:nth-child(2)": { animationDelay: "0.18s" },
    "& span:nth-child(3)": { animationDelay: "0.36s" },
  }),
  inputArea: css({
    padding: "8px 10px",
    borderTop: "1px solid rgba(124,58,237,0.1)",
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    background: "white",
    flexShrink: 0,
  }),
  input: css({
    flex: 1,
    border: "1.5px solid #e5e7eb",
    borderRadius: "20px",
    padding: "9px 14px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "none",
    lineHeight: 1.4,
    maxHeight: "96px",
    overflowY: "auto",
    transition: "border-color 0.2s, box-shadow 0.2s",
    background: "white",
    "&:focus": {
      outline: "none",
      borderColor: PURPLE,
      boxShadow: "0 0 0 3px rgba(124,58,237,0.1)",
    },
    "&:disabled": { background: "#f3f4f6", cursor: "not-allowed" },
    "@media (max-width: 640px)": {
      fontSize: "13px",
      padding: "8px 12px",
      maxHeight: "88px",
    },
  }),
  sendBtn: css({
    width: "38px",
    height: "38px",
    background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
    color: "white",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.2s, opacity 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
    "&:hover:not(:disabled)": {
      transform: "scale(1.08)",
      boxShadow: "0 4px 14px rgba(124,58,237,0.45)",
    },
    "&:active:not(:disabled)": { transform: "scale(0.93)" },
    "&:disabled": { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" },
  }),
  messageText: css({
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.45,
    wordBreak: "break-word",
    "& ul, & ol": { margin: "0.25em 0 0.25em 1.2em", padding: 0 },
    "& li": { marginBottom: "0.15em" },
    "& strong": { fontWeight: 600 },
    "& em": { fontStyle: "italic" },
    "& code": {
      fontFamily: 'ui-monospace,"Cascadia Code","Fira Code",monospace',
      fontSize: "0.85em",
      background: "rgba(124,58,237,0.1)",
      borderRadius: "3px",
      padding: "0.1em 0.35em",
    },
  }),
  messageTextMine: css({ "& code": { background: "rgba(255,255,255,0.2)" } }),
  messageLink: css({
    color: "inherit",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
    wordBreak: "break-all",
    opacity: 0.85,
    "&:hover": { opacity: 1 },
  }),
  mdPara: css({
    display: "block",
    margin: "0 0 0.35em",
    "&:last-child": { marginBottom: 0 },
  }),
}
export default Chatbox
