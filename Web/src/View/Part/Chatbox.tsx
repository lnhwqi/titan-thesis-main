import React from "react"
import { State } from "../../State"
import { ConversationID } from "../../../../Core/App/Message"
import { emit } from "../../Runtime/React"
import * as MessageAction from "../../Action/Message"
import styles from "./Chatbox.module.css"

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
    error,
    conversationsError,
  } = state.message

  const handleToggle = () => emit(MessageAction.toggleChatbox())
  const handleOpenConversation = (conversationID: ConversationID) =>
    emit(MessageAction.openConversation(conversationID))
  const handleChangeMessage = (text: string) =>
    emit(MessageAction.updateMessageInput(text))
  const handleSendMessage = () => emit(MessageAction.sendMessage())
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  return (
    <div className={`${styles.chatboxContainer} ${isOpen ? styles.open : ""}`}>
      {/* Toggle Button */}
      <div className={styles.chatboxToggleWrap}>
        {!isOpen && (
          <div className={styles.chatboxBubble}>
            <span className={styles.chatboxBubbleText}>Chat with us!</span>
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

      {/* Chatbox Window */}
      {isOpen && (
        <div className={styles.chatboxWindow}>
          <div className={styles.header}>
            <h3>Messages</h3>
            <button
              className={styles.closeBtn}
              onClick={handleToggle}
              aria-label="Close chatbox"
            >
              ✕
            </button>
          </div>

          {(error != null || conversationsError != null) && (
            <p className={styles.errorBanner}>{error ?? conversationsError}</p>
          )}

          <div className={styles.content}>
            {/* Conversations List */}
            <div className={styles.conversationList}>
              <h4>Conversations</h4>
              {conversationsLoading && <p>Loading conversations...</p>}
              <ul className={styles.conversations}>
                {conversations.length === 0 && !conversationsLoading ? (
                  <p className={styles.emptyState}>No conversations yet.</p>
                ) : (
                  conversations.map((conv) => (
                    <li
                      key={conv.id.unwrap()}
                      className={`${styles.conversationItem} ${
                        currentConversationID?.unwrap() === conv.id.unwrap()
                          ? styles.active
                          : ""
                      }`}
                      onClick={() => handleOpenConversation(conv.id)}
                    >
                      <div className={styles.conversationInfo}>
                        <span className={styles.participantName}>
                          {conv.participantName}
                          {onlineUsers.has(conv.participantIDs.unwrap()) && (
                            <span className={styles.onlineIndicator}>●</span>
                          )}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className={styles.lastMessage}>
                          {conv.lastMessage.senderName}:{" "}
                          {conv.lastMessage.text.unwrap().substring(0, 30)}
                          {conv.lastMessage.text.unwrap().length > 30
                            ? "…"
                            : ""}
                        </p>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Messages Panel */}
            {currentConversationID && (
              <div className={styles.messagesContainer}>
                {messagesLoading && (
                  <p className={styles.loading}>Loading messages...</p>
                )}
                {!messagesLoading && (
                  <div className={styles.messagesList}>
                    {currentMessages.length === 0 && (
                      <p className={styles.noMessages}>
                        No messages yet. Say hello!
                      </p>
                    )}
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id.unwrap()}
                        className={`${styles.messageItem} ${
                          msg.senderType === "SYSTEM" ? styles.system : ""
                        } ${msg.senderType === "USER" ? styles.user : styles.other}`}
                      >
                        <div className={styles.messageMeta}>
                          <span className={styles.senderName}>
                            {msg.senderName}
                          </span>
                          <span className={styles.timestamp}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                          {msg.readAt && (
                            <span className={styles.readReceipt}>✓✓</span>
                          )}
                        </div>
                        <p className={styles.messageText}>
                          {msg.text.unwrap()}
                        </p>
                      </div>
                    ))}
                    {typingUsers.size > 0 && (
                      <div className={styles.typingIndicator}>
                        <span>
                          {Array.from(typingUsers).join(", ")} is typing
                        </span>
                        <span className={styles.dots}>
                          <span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </span>
                      </div>
                    )}
                    <div id="chatbox-messages-end" />
                  </div>
                )}

                {/* Message Input */}
                <div className={styles.inputArea}>
                  <textarea
                    id="chatbox-input"
                    className={styles.input}
                    placeholder="Type a message… (Enter to send)"
                    value={messageInput}
                    onChange={(e) => handleChangeMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={2}
                  />
                  <button
                    className={`${styles.sendBtn} ${
                      isLoading ? styles.disabled : ""
                    }`}
                    onClick={handleSendMessage}
                    disabled={isLoading || !messageInput.trim()}
                    aria-label="Send message"
                  >
                    {isLoading ? "…" : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Chatbox
