# Chatbox System - Architecture & Implementation Guide

## Overview

The chatbox system is a real-time messaging platform using **Socket.IO** for
bidirectional communication between users and sellers. It supports:

- **System announcements** - Broadcast messages from admins
- **User-to-system support** - Users can contact support
- **User-to-user/seller messaging** - Direct conversations
- **Real-time features** - Typing indicators, read receipts, online status,
  notifications

---

## Architecture

### 1. **Data Layer** (`Core/App/Message.ts`)

**Core Types:**

```typescript
// Unique message identifier (branded type)
MessageID = Opaque<string, "MessageID">

// Conversation identifier
ConversationID = Opaque<string, "ConversationID">

// Message text (branded string with validation)
MessageText = Opaque<string, "MessageText">

// Sender types: USER, SELLER, or SYSTEM
SenderType = "USER" | "SELLER" | "SYSTEM"

// Full message structure
Message = {
  id: MessageID
  conversationID: ConversationID
  senderID: UserID | SellerID | "SYSTEM"
  senderType: SenderType
  senderName: string  // Display name
  text: MessageText
  readAt: Date | null  // When recipient read it
  createdAt: Date
}

// Conversation metadata
Conversation = {
  id: ConversationID
  participantIDs: UserID | SellerID
  participantName: string
  lastMessage: Message | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}
```

**Why Opaque Types?**

- Type safety: can't confuse MessageID with ConversationID
- Branding forces explicit conversions
- Runtime validation via decoders
- Aligns with project's architecture

---

### 2. **State Management** (`Web/src/State/Message.ts`)

Follows the project's **discriminated union + RemoteData** pattern:

```typescript
MessageState = {
  // List of user's conversations
  conversations: RemoteData<ApiError, Conversation[]>
    // States: NotAsked | Loading | Failure | Success

  // Currently selected conversation ID
  currentConversationID: ConversationID | null

  // Messages in current conversation
  currentMessages: RemoteData<ApiError, Message[]>

  // Draft message text (form field with validation)
  newMessage: FieldString<string, MessageInput>

  // UI state
  isOpen: boolean
  isLoading: boolean

  // Real-time state
  typingUsers: Set<string>        // Users currently typing
  onlineUsers: Set<string>        // Users currently online

  // Pagination
  page: number
  totalCount: number
}
```

**RemoteData Pattern:**

```typescript
RemoteData<E, T> =
  | NotAsked                 // Never loaded
  | Loading                  // Currently loading
  | Failure<E>              // Load failed with error
  | Success<T>              // Loaded successfully

// Usage:
if (messages._t === "Success") {
  messages.value.forEach(msg => render(msg))
}
```

---

### 3. **Actions** (`Web/src/Action/Message.ts`)

Pure functions that transform state via the **Action** pattern:

```typescript
Action = (state: State) => [State, Cmd]

// Example:
export function toggleChatbox(): Action {
  return (state) => [
    _MessageState(state, { isOpen: !state.message.isOpen }),
    cmd()  // No side effects
  ]
}

export function sendMessage(): Action {
  return (state) => [
    _MessageState(state, { isLoading: true }),
    cmd(
      sendMessageSocket(...).then(onSendMessageResponse)
    )
  ]
}
```

**Key Actions:**

| Action                      | Purpose                      |
| --------------------------- | ---------------------------- |
| `toggleChatbox()`           | Show/hide chatbox            |
| `openConversation(id)`      | Load conversation messages   |
| `onChangeMessage(text)`     | Update draft + notify typing |
| `sendMessage()`             | Send via Socket.IO           |
| `markAsRead(id)`            | Update read status           |
| `onMessageReceived(msg)`    | Handle incoming messages     |
| `onUserTyping(data)`        | Handle typing indicator      |
| `onUserStatusChanged(data)` | Handle online/offline status |
| `loadConversations()`       | Fetch conversation list      |

---

### 4. **UI Component** (`Web/src/View/Part/Chatbox.tsx`)

**Responsive React component:**

```
┌─ Chatbox Container (position: fixed, bottom-right)
│
├─ Toggle Button (circular, 56x56px)
│
└─ Chatbox Window (400x600px, closed by default)
   ├─ Header (gradient background)
   ├─ Content Area
   │  ├─ Conversations List (140px width, sidebar)
   │  │  ├─ Conversation items
   │  │  └─ Unread badges & online indicator
   │  │
   │  └─ Messages Display (flex: 1)
   │     ├─ Messages list (scrollable)
   │     │  ├─ User messages (light blue, right-aligned)
   │     │  ├─ Other messages (gray, left-aligned)
   │     │  ├─ System messages (yellow, centered)
   │     │  └─ Read receipts (✓✓)
   │     │
   │     ├─ Typing indicator (dots animation)
   │     └─ Input area
   │        ├─ Textarea (2 rows, 1000 char limit)
   │        └─ Send button
   │
   └─ Responsive: Full-screen on mobile
```

**Key Features:**

- ✅ Auto-scroll to latest message
- ✅ Auto-focus input when opened
- ✅ Typing indicators with animation
- ✅ Read receipts (✓ and ✓✓)
- ✅ Online status indicators
- ✅ Unread message badges
- ✅ Keyboard shortcuts (Shift+Enter for new line, Enter to send)
- ✅ Loading states
- ✅ Error messages
- ✅ Disabled state while sending

---

### 5. **Socket.IO Client** (`Web/src/Runtime/Socket.ts`)

Handles real-time bidirectional communication:

**Initialization:**

```typescript
initializeSocket(dispatchFn, authToken?)
  // Establishes connection
  // Sets up event listeners
  // Exposes socket globally via window.__socket
```

**Event Handlers (listening):**

```typescript
socket.on("message:received", (data) => {
  // New message arrived
  dispatch(onMessageReceived(data.message))
})

socket.on("message:userTyping", (data) => {
  // User started typing
  dispatch(onUserTyping(data))
})

socket.on("user:statusChanged", (data) => {
  // User came online/offline
  dispatch(onUserStatusChanged(data))
})

socket.on("conversation:updated", () => {
  // Conversation list changed
  dispatch(loadConversations())
})
```

**Event Emitters (sending):**

```typescript
// Send message
emitSendMessage(conversationID, text)

// Notify typing
emitTyping(conversationID)

// Mark message as read
emitMessageRead(messageID)

// Get conversations
emitGetConversations()

// Get messages
emitGetMessages(conversationID, page, limit)

// Start conversation
emitStartConversation(participantID)
```

**Socket Setup (Auth):**

```typescript
io(socketUrl, {
  auth: {
    token: JWT_TOKEN, // Server validates in middleware
  },
  reconnection: true,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"], // Fallback support
})
```

---

### 6. **Socket.IO Server** (`Api/src/Socket.ts`)

Handles real-time message processing:

**Authentication:**

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  const decoded = JWT.verify(token, JWT_SECRET)
  socket.handshake.user = decoded
  next()
})
```

**Event Handlers:**

```typescript
socket.on("message:send", (data, callback) => {
  // Validate message
  // Save to database (TODO)
  // Emit to conversation room
  // Respond to sender
})

socket.on("message:typing", (data) => {
  // Broadcast typing indicator to conversation
})

socket.on("conversation:list", (data, callback) => {
  // Fetch user's conversations
  // Send to client with callback
})

socket.on("message:list", (data, callback) => {
  // Fetch paginated messages
  // Join conversation room
})

socket.on("conversation:start", (data, callback) => {
  // Create new conversation (TODO)
  // Notify other participant
})
```

**Room Structure:**

```
Socket.IO Rooms:
├─ user:{userID}        // User-specific (notifications, status)
├─ conversation:{convID} // Conversation members (messages)
└─ seller:{sellerID}    // Seller-specific (seller notifications)
```

**Broadcasting:**

```typescript
socket.emit() // To sender only
io.emit() // To all connected users
io.to(roomId).emit() // To specific room
socket.broadcast.emit() // To all except sender
io.to(roomId).except(socket).emit() // To room except sender
```

---

## Data Flow Diagrams

### **1. Send Message Flow**

```
User types message
    ↓
onChange → dispatch(onChangeMessage(text))
    ↓
Update state.message.newMessage
    ↓
Trigger typing indicator via Socket.IO
    ↓
User presses Enter
    ↓
dispatch(sendMessage())
    ↓
Emit: socket.emit("message:send", {conversationID, text})
    ↓
Server receives & validates
    ↓
Server saves to database (TODO)
    ↓
Server broadcasts to conversation room:
  socket.to(convRoom).emit("message:received", {message})
    ↓
Client receives "message:received" event
    ↓
dispatch(onMessageReceived(message))
    ↓
Update state.message.currentMessages
    ↓
React re-renders message list
```

### **2. Typing Indicator Flow**

```
User types in textarea
    ↓
onChange throttled (debounced)
    ↓
socket.emit("message:typing", {conversationID})
    ↓
Server broadcasts:
  io.to(convRoom).emit("message:userTyping", {userID, conversationID})
    ↓
Other clients receive event
    ↓
dispatch(onUserTyping(data))
    ↓
Add to state.message.typingUsers
    ↓
Auto-remove after 3 seconds
    ↓
React re-renders typing indicator
```

### **3. Load Conversations Flow**

```
Chatbox mounts OR user logs in
    ↓
dispatch(loadConversations())
    ↓
Update state.message.conversations = RemoteData.loading()
    ↓
socket.emit("conversation:list", {}, callback)
    ↓
Server queries database (TODO)
    ↓
Server calls callback({ success: true, conversations })
    ↓
Callback resolves promise
    ↓
dispatch(onLoadConversationsResponse(response))
    ↓
Update state.message.conversations = RemoteData.success([...])
    ↓
React renders conversation list
```

### **4. Read Receipt Flow**

```
Message appears in viewport
    ↓
useEffect monitors currentMessages
    ↓
For each unread message:
  dispatch(markAsRead(messageID))
    ↓
socket.emit("message:read", {messageID})
    ↓
Server updates message.readAt in database (TODO)
    ↓
Server broadcasts:
  io.emit("message:read", {messageID, readAt})
    ↓
All clients receive event
    ↓
Update message with readAt timestamp
    ↓
React renders ✓✓ receipt indicator
```

---

## Integration Checklist

### **Phase 1: UI/UX & Flow (DONE ✓)**

- [x] Core data types (Message, Conversation, MessageID, etc.)
- [x] State structure with RemoteData
- [x] Action creators for all user interactions
- [x] Chatbox React component with styling
- [x] Socket.IO client setup
- [x] Socket.IO server setup

### **Phase 2: Database Integration (TODO)**

- [ ] Create `conversation` table migration
- [ ] Create `message` table migration
- [ ] Add indexes for performant queries
- [ ] Implement message save in `message:send` handler
- [ ] Implement conversation fetch in `conversation:list` handler
- [ ] Implement message fetch in `message:list` handler

### **Phase 3: API Contracts (TODO)**

- [ ] Create `Core/Api/Auth/User/Message/*.ts` contracts
- [ ] Add message endpoints to `Api/src/Route/Message.ts`
- [ ] Add HTTP endpoints alongside Socket.IO

### **Phase 4: Authentication & Authorization (TODO)**

- [ ] Verify user can only see own conversations
- [ ] Prevent users from accessing other's messages
- [ ] Add role-based access (user vs seller)
- [ ] Rate limiting on message sends

### **Phase 5: Advanced Features (TODO)**

- [ ] Message search
- [ ] Conversation archiving
- [ ] Block/unblock users
- [ ] File/image sharing
- [ ] Message reactions
- [ ] Message editing/deletion

---

## Usage Example

### **Initialize in App**

```typescript
// In Web/src/index.tsx or main app component
import { initializeSocket } from "./Runtime/Socket"

function App() {
  useEffect(() => {
    const authToken = getAuthToken()
    initializeSocket(dispatch, authToken).catch(error => {
      console.error("Socket connection failed:", error)
    })
  }, [])

  return <YourApp />
}
```

### **Render Chatbox**

```typescript
// In Web/src/View.tsx or layout
import Chatbox from "./View/Part/Chatbox"

export function View(state: State, dispatch: Dispatch): JSX.Element {
  return (
    <Layout>
      <YourContent />

      <Chatbox
        isOpen={state.message.isOpen}
        conversations={state.message.conversations}
        currentMessages={state.message.currentMessages}
        messageInput={state.message.newMessage.value}
        isLoading={state.message.isLoading}
        typingUsers={state.message.typingUsers}
        onlineUsers={state.message.onlineUsers}
        currentConversationID={state.message.currentConversationID}
        onToggle={() => dispatch(Message.toggleChatbox())}
        onOpenConversation={(id) => dispatch(Message.openConversation(id))}
        onChangeMessage={(text) => dispatch(Message.onChangeMessage(text))}
        onSendMessage={() => dispatch(Message.sendMessage())}
        onMarkAsRead={(id) => dispatch(Message.markAsRead(id))}
      />
    </Layout>
  )
}
```

---

## File Structure

```
Core/
  App/
    Message.ts                          ← Data types & decoders

Web/
  src/
    State/
      Message.ts                        ← State structure
    Action/
      Message.ts                        ← Action creators
    View/
      Part/
        Chatbox.tsx                     ← React component
        Chatbox.module.css              ← Styles
    Runtime/
      Socket.ts                         ← Socket.IO client

Api/
  src/
    Socket.ts                           ← Socket.IO server
    index.ts                            ← Server initialization (updated)
    Route/
      Message.ts                        ← (TODO) HTTP routes
```

---

## Environment Variables

```env
# Api/.env or Api/.env.example
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000

# Web/.env or Web/.env.example
REACT_APP_SOCKET_URL=http://localhost:3001
```

---

## Next Steps

1. **Connect to database** - Replace TODO comments with actual DB queries
2. **Create migrations** - Set up `conversation` and `message` tables
3. **Test Socket events** - Use Socket.IO dev tools to verify real-time flow
4. **Add error handling** - Comprehensive error messages and recovery
5. **Implement features** - Typing debounce, message pagination, etc.

---

## References

- Socket.IO Docs: https://socket.io/docs/
- Socket.IO Rooms: https://socket.io/docs/v4/rooms/
- JWT Authentication:
  https://socket.io/docs/v4/socket-io-protocol/#authentication
- Project Architecture: See `/memories/repo/titan-thesis-main.md`
