# Chatbox System - Developer Reference Card

**Quick lookup for common tasks**

---

## 📌 File Locations

| What          | Where                                  |
| ------------- | -------------------------------------- |
| Data types    | `Core/App/Message.ts`                  |
| State         | `Web/src/State/Message.ts`             |
| Actions       | `Web/src/Action/Message.ts`            |
| Component     | `Web/src/View/Part/Chatbox.tsx`        |
| Styles        | `Web/src/View/Part/Chatbox.module.css` |
| Socket Client | `Web/src/Runtime/Socket.ts`            |
| Socket Server | `Api/src/Socket.ts`                    |
| Server Init   | `Api/src/index.ts`                     |

---

## 🎬 Common Actions

### Toggle Chatbox

```typescript
dispatch(MessageAction.toggleChatbox())
```

### Open Conversation

```typescript
dispatch(MessageAction.openConversation(conversationID))
```

### Send Message

```typescript
dispatch(MessageAction.sendMessage())
```

### Update Draft

```typescript
dispatch(MessageAction.onChangeMessage(text))
```

### Mark as Read

```typescript
dispatch(MessageAction.markAsRead(messageID))
```

### Load Conversations

```typescript
dispatch(MessageAction.loadConversations())
```

---

## 🔌 Socket.IO Events

### Emit (Client → Server)

```typescript
// Send message
socket.emit("message:send", { conversationID, text }, (response) => {
  /* handle response */
})

// Notify typing
socket.emit("message:typing", { conversationID })

// Get conversations
socket.emit("conversation:list", {}, (response) => {})

// Get messages
socket.emit("message:list", { conversationID, page, limit }, (response) => {})
```

### Listen (Server → Client)

```typescript
socket.on("message:received", (data) => {
  // { message: Message }
})

socket.on("message:userTyping", (data) => {
  // { conversationID, userID }
})

socket.on("user:statusChanged", (data) => {
  // { userID, status: "online" | "offline" }
})

socket.on("conversation:updated", (data) => {
  // { conversationID }
})
```

---

## 🏗️ State Access

### Read State

```typescript
state.message.isOpen // boolean
state.message.conversations // RemoteData<E, Conversation[]>
state.message.currentMessages // RemoteData<E, Message[]>
state.message.newMessage.value // string (draft text)
state.message.isLoading // boolean
state.message.typingUsers // Set<string>
state.message.onlineUsers // Set<string>
```

### Update State

```typescript
_MessageState(state, {
  isOpen: true,
  currentConversationID: convID,
  currentMessages: RD.success([...])
})
```

---

## 💻 Component Props

```typescript
interface ChatboxProps {
  isOpen: boolean
  conversations: RemoteData<any, Conversation[]>
  currentMessages: RemoteData<any, Message[]>
  messageInput: string
  isLoading: boolean
  typingUsers: Set<string>
  onlineUsers: Set<string>
  currentConversationID: string | null
  onToggle: () => void
  onOpenConversation: (id: string) => void
  onChangeMessage: (text: string) => void
  onSendMessage: () => void
  onMarkAsRead: (messageID: string) => void
}
```

---

## 🔄 RemoteData Handling

### Loading

```typescript
if (messages._t === "Loading") {
  return <Spinner />
}
```

### Failure

```typescript
if (messages._t === "Failure") {
  return <Error message={messages.error} />
}
```

### Success

```typescript
if (messages._t === "Success") {
  return messages.value.map(msg => <Message {...msg} />)
}
```

### Pattern

```typescript
// Full check
if (messages._t === "Success") {
  messages.value // The actual data
} else if (messages._t === "Failure") {
  messages.error // The error
} else {
  // Loading or NotAsked
}
```

---

## 🚀 Integration Checklist

```typescript
// 1. Update State type
type State = {
  // ... existing
  message: MessageState
}

// 2. Update State initialization
const initState = {
  // ... existing
  message: initMessageState
}

// 3. Initialize Socket
useEffect(() => {
  const token = getAuthToken()
  initializeSocket(dispatch, token)
}, [])

// 4. Render component
<Chatbox {...props} />

// 5. Wire actions
dispatch(MessageAction.toggleChatbox())
```

---

## 📊 Key Types

```typescript
// IDs (branded types)
type MessageID = Opaque<string, "MessageID">
type ConversationID = Opaque<string, "ConversationID">
type MessageText = Opaque<string, "MessageText">

// Main types
type Message = {
  id: MessageID
  conversationID: ConversationID
  senderID: UserID | SellerID | "SYSTEM"
  senderType: "USER" | "SELLER" | "SYSTEM"
  senderName: string
  text: MessageText
  readAt: Date | null
  createdAt: Date
}

type Conversation = {
  id: ConversationID
  participantIDs: UserID | SellerID
  participantName: string
  lastMessage: Message | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}
```

---

## 🛠️ Troubleshooting Map

| Problem              | Check                | Solution                             |
| -------------------- | -------------------- | ------------------------------------ |
| Socket won't connect | Port 3001 accessible | Check API server running             |
| Messages not sending | Socket connected     | Check window.\_\_socket.connected    |
| Typing not showing   | Event emitting       | Check socket.emit("message:typing")  |
| Styles not loading   | CSS module import    | Import Chatbox.module.css            |
| State not updating   | Action dispatch      | Check dispatch(MessageAction.\*)     |
| Type errors          | Message.ts types     | Verify MessageID, Conversation types |
| Props missing        | Component definition | Check all 11 required props          |
| Conversations empty  | Database             | Mock data in Socket.ts line ~105     |
| Read receipt stuck   | Event handler        | Check message:read event             |
| Online status wrong  | User set update      | Check onUserStatusChanged action     |

---

## 🎨 CSS Classes Reference

```css
.chatboxContainer     /* Outer fixed container */
.chatboxToggle        /* Purple button */
.chatboxWindow        /* Main window */
.header               /* Header with gradient */
.conversationList     /* Left sidebar */
.conversationItem     /* Individual conversation */
.messagesContainer    /* Messages area */
.messagesList         /* Scrollable messages */
.messageItem          /* Single message */
.messageItem.user     /* User's message (blue) */
.messageItem.other    /* Other user's message (gray) */
.messageItem.system   /* System message (yellow) */
.inputArea            /* Input section */
.input                /* Textarea */
.sendBtn              /* Send button */
```

---

## 🔐 Security Reminders

- ✅ Always validate message length (1000 chars max)
- ✅ Always validate non-empty message
- ✅ Always use JWT token in Socket auth
- ✅ Always verify conversation ownership
- ❌ Don't store passwords in state
- ❌ Don't log sensitive data
- ❌ Don't trust client-side validation alone

---

## 📱 Responsive Breakpoints

```typescript
// Tailwind (if used)
sm: 640px  // Mobile landscape
md: 768px  // Tablet
lg: 1024px // Desktop
xl: 1280px // Large desktop

// Chatbox behavior
< 640px   → Full-screen overlay
≥ 640px   → Fixed window (400x600)
≥ 1024px  → Full-size window ready
```

---

## 🎯 Environment Variables

```bash
# Api/.env
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
APP_PORT=3001

# Web/.env.local
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_API_URL=http://localhost:3001
```

---

## 📈 Performance Tips

1. **Debounce typing events** (500ms)
2. **Paginate messages** (20 per page)
3. **Batch read receipts** (2s accumulation)
4. **Lazy load conversations** (on scroll)
5. **Limit Sets size** (remove old entries)
6. **Use React.memo** for Message items
7. **Virtualize long lists** (if 100+ messages)

---

## 🧪 Quick Test Commands

```bash
# Check Socket connected
window.__socket?.connected

# Emit test message
window.__socket?.emit("message:send",
  { conversationID: "test", text: "hello" },
  console.log
)

# Check state in Redux DevTools
// Look for action: MessageAction.toggleChatbox
// Check state.message.isOpen changed

# Monitor network in DevTools
// Network tab → WS → socket.io
// Messages tab to see Socket.IO events
```

---

## 💡 Common Patterns

### Check if loaded

```typescript
if (messages._t === "Success" && messages.value.length > 0) {
  // Messages are loaded
}
```

### Check if loading

```typescript
if (messages._t === "Loading") {
  // Show spinner
}
```

### Get error message

```typescript
if (conversations._t === "Failure") {
  const error = conversations.error.message
  // Use error in UI
}
```

### Dispatch action

```typescript
const action = MessageAction.toggleChatbox()
dispatch(action)
```

---

## 🔍 Debugging Checklist

- [ ] `window.__socket?.connected` is true
- [ ] `state.message.isOpen` is correct
- [ ] `state.message.conversations._t` is "Success"
- [ ] Message input value updates on onChange
- [ ] Send button disabled when empty
- [ ] No TypeScript errors in IDE
- [ ] No runtime errors in console
- [ ] Socket events visible in Network tab
- [ ] Chatbox CSS loads (check Elements)
- [ ] Component renders without errors

---

## 📞 Quick Contacts

**Code Issues:**

- Check `Api/src/Socket.ts` for handlers
- Check `Web/src/Action/Message.ts` for state transitions
- Check `Web/src/State/Message.ts` for state shape

**Design Questions:**

- Read `CHATBOX_ARCHITECTURE.md`

**Setup Help:**

- Read `CHATBOX_QUICKSTART.md`

**Implementation Details:**

- Read `CHATBOX_IMPLEMENTATION.md`

---

**Last Updated:** April 23, 2026  
**Version:** 1.0  
**Status:** Production Ready (UI/UX) 🚀
