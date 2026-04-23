# Chatbox System - Quick Start Guide

## What Was Created

A **real-time messaging chatbox** system with Socket.IO that allows users to
communicate with each other and system administrators. Supports typing
indicators, read receipts, online status, and system announcements.

### Files Created:

**Core Data Layer:**

- `Core/App/Message.ts` - Data types for messages and conversations

**Web Frontend:**

- `Web/src/State/Message.ts` - State management structure
- `Web/src/Action/Message.ts` - Action creators for state transitions
- `Web/src/View/Part/Chatbox.tsx` - React chatbox component
- `Web/src/View/Part/Chatbox.module.css` - Styling
- `Web/src/Runtime/Socket.ts` - Socket.IO client setup

**Backend:**

- `Api/src/Socket.ts` - Socket.IO server setup
- `Api/src/index.ts` - Updated to initialize Socket.IO server

**Documentation:**

- `CHATBOX_ARCHITECTURE.md` - Full architecture guide
- `CHATBOX_QUICKSTART.md` - This file

---

## Installation

### 1. Install Socket.IO Dependencies

```bash
# In the root directory
npm install socket.io socket.io-client

# Or in specific directories if using workspaces
cd Api && npm install socket.io
cd ../Web && npm install socket.io-client
```

### 2. Environment Variables

Create `.env` files:

**Api/.env**

```env
JWT_SECRET=your-jwt-secret-here
FRONTEND_URL=http://localhost:3000
SOCKET_IO_PATH=/socket.io
```

**Web/.env.local**

```env
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 3. Run Development Server

```bash
# The updated Api/src/index.ts now initializes Socket.IO automatically
npm start
```

The server will output:

```
⚡️[server]: Server is running at http://localhost:3001
```

---

## How to Use

### **In Your Application**

#### 1. Initialize Socket Connection

```typescript
// In your app initialization (e.g., pages/Home.tsx or App.tsx)
import { initializeSocket } from "./Runtime/Socket"

function YourComponent() {
  useEffect(() => {
    const token = localStorage.getItem("authToken")

    initializeSocket(dispatch, token)
      .catch(error => console.error("Socket connection failed:", error))
  }, [])

  return <YourUI />
}
```

#### 2. Render the Chatbox

```typescript
// In your main View or Layout component
import Chatbox from "./View/Part/Chatbox"
import * as MessageAction from "./Action/Message"

export function View(state: State, dispatch: Dispatch) {
  return (
    <>
      <YourPageContent />

      <Chatbox
        isOpen={state.message.isOpen}
        conversations={state.message.conversations}
        currentMessages={state.message.currentMessages}
        messageInput={state.message.newMessage.value}
        isLoading={state.message.isLoading}
        typingUsers={state.message.typingUsers}
        onlineUsers={state.message.onlineUsers}
        currentConversationID={state.message.currentConversationID}
        onToggle={() => dispatch(MessageAction.toggleChatbox())}
        onOpenConversation={(id) => dispatch(MessageAction.openConversation(id))}
        onChangeMessage={(text) => dispatch(MessageAction.onChangeMessage(text))}
        onSendMessage={() => dispatch(MessageAction.sendMessage())}
        onMarkAsRead={(id) => dispatch(MessageAction.markAsRead(id))}
      />
    </>
  )
}
```

#### 3. Dispatch Actions for User Interactions

```typescript
// Toggle chatbox visibility
dispatch(MessageAction.toggleChatbox())

// Open a specific conversation
dispatch(MessageAction.openConversation(conversationID))

// User types a message
dispatch(MessageAction.onChangeMessage(userText))

// Send message (automatically emits via Socket.IO)
dispatch(MessageAction.sendMessage())

// Load conversations list
dispatch(MessageAction.loadConversations())

// Mark message as read
dispatch(MessageAction.markAsRead(messageID))
```

---

## Socket.IO Events Reference

### **Client → Server Events**

```typescript
// Send a message
socket.emit("message:send", { conversationID: string, text: string }, callback)

// Notify typing
socket.emit("message:typing", { conversationID: string })

// Mark message as read
socket.emit("message:read", { messageID: string })

// Get conversations list
socket.emit("conversation:list", {}, callback)

// Get messages for conversation
socket.emit(
  "message:list",
  { conversationID: string, page: number, limit: number },
  callback,
)

// Start new conversation
socket.emit("conversation:start", { participantID: string }, callback)
```

### **Server → Client Events**

```typescript
// Incoming message
socket.on("message:received", (data: { message: Message }) => {})

// User is typing
socket.on("message:userTyping", (data: { conversationID; userID }) => {})

// User stopped typing
socket.on("message:userStoppedTyping", (data: { conversationID; userID }) => {})

// User online/offline status
socket.on(
  "user:statusChanged",
  (data: { userID; status: "online" | "offline" }) => {},
)

// Message read receipt
socket.on("message:read", (data: { messageID; readAt: Date }) => {})

// Conversation list updated
socket.on("conversation:updated", (data: { conversationID }) => {})
```

---

## Testing the Chatbox

### **Manual Testing**

1. Start the server: `npm start`
2. Open http://localhost:3000 in browser
3. Login with a user account
4. Look for the **purple circular button** in the bottom-right corner
5. Click to open the chatbox
6. Start typing in the input area
7. Press Enter or click Send

### **What to Test**

- [ ] Chatbox toggle button works
- [ ] Conversations list loads
- [ ] Can open a conversation
- [ ] Message history displays
- [ ] Can type and send messages
- [ ] Typing indicator appears
- [ ] Read receipts (✓✓) show
- [ ] Online indicator shows
- [ ] New messages appear in real-time
- [ ] Input clears after sending
- [ ] Error messages display properly

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (React)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  View.tsx (Component Layer)                                  │
│    ↓                                                          │
│  Chatbox.tsx (React Component)                               │
│    ↓                                                          │
│  State/Message.ts (State Container)  ← Action/Message.ts   │
│    ↓                                    (State Transitions)  │
│  Runtime/Socket.ts (Real-time Client)                       │
│    ↓                                                          │
│  ┌─ WebSocket Connection ─────────────────────────────────┐ │
│  │ socket.io-client v4.x                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                   WebSocket / Polling
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Node.js API Server                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Api/src/index.ts (HTTP + Socket.IO Server)                 │
│    ↓                                                          │
│  Socket.ts (Socket.IO Handler Layer)                        │
│    ├─ Authentication Middleware                              │
│    ├─ Message Events                                         │
│    ├─ Conversation Events                                    │
│    ├─ Room Management                                        │
│    └─ Broadcasting                                           │
│      ↓                                                        │
│  Database Layer (PostgreSQL - TODO)                          │
│    ├─ conversation table                                     │
│    └─ message table                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

```
User Action (onClick, onChange, etc.)
  ↓
dispatch(MessageAction.*)
  ↓
Action Creator (returns function)
  ↓
  (state) => [newState, Cmd]
  ↓
  ┌─ Sync: State Update
  │   └─ _MessageState(state, updates)
  │      └─ Update state.message.* properties
  │         └─ React detects state change
  │            └─ Component re-renders
  │
  └─ Async: Command Execution (Socket.IO events)
      └─ socket.emit("event", data, callback)
         └─ Server processes
            └─ Server broadcasts to clients
               └─ socket.on("event", callback)
                  └─ dispatch(MessageAction.*)
                     └─ State update (back to sync step)
```

---

## Database Schema (TODO)

Once you connect to PostgreSQL, create these tables:

```sql
-- Conversations
CREATE TABLE conversation (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  seller_id VARCHAR(36) REFERENCES seller(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE message (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  sender_id VARCHAR(36) NOT NULL,  -- Can be user_id or seller_id
  sender_type VARCHAR(10) NOT NULL,  -- 'USER', 'SELLER', 'SYSTEM'
  text TEXT NOT NULL,
  read_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_conversation_id (conversation_id),
  INDEX idx_created_at (created_at DESC)
);

-- Create indexes for performance
CREATE INDEX idx_conversation_user ON conversation(user_id);
CREATE INDEX idx_conversation_seller ON conversation(seller_id);
CREATE INDEX idx_message_unread ON message(conversation_id, read_at);
```

---

## Next Steps

### **Priority 1: Database Integration**

1. Create the migrations above
2. Replace `TODO` comments in `Api/src/Socket.ts`
3. Implement actual database queries

### **Priority 2: API Contracts (Optional)**

1. Create REST endpoints alongside Socket.IO for:
   - GET /messages/:conversationID
   - POST /messages
   - GET /conversations
2. Use the existing API architecture in `Core/Api/Public/Message/*`

### **Priority 3: Polish**

1. Add message pagination
2. Add search functionality
3. Add typing debounce
4. Handle reconnection gracefully
5. Add sound notifications
6. Add emoji picker

### **Priority 4: Advanced Features**

1. File/image sharing
2. Message reactions
3. Conversation pinning
4. User blocking
5. Message editing/deletion

---

## Troubleshooting

### **Socket won't connect**

```
Check these:
- Is the API server running? (npm start in Api)
- Is port 3001 accessible?
- Is CORS configured correctly?
- Is authToken valid?
- Check browser console for errors
- Check server logs for connection attempts
```

### **Messages not sending**

```
Check these:
- Is socket connected? (check window.__socket)
- Is conversation selected?
- Is message text not empty?
- Check socket emit callbacks for errors
- Check server console for handler errors
```

### **Typing indicator not working**

```
Check these:
- Is typing event being emitted?
- Check socket server handlers
- Verify room broadcasts are working
- Check for typos in event names (case-sensitive!)
```

---

## Performance Considerations

- **Message Pagination**: Load 20 messages per page, lazy load on scroll
- **Typing Debounce**: Debounce typing events every 500ms
- **Read Receipts**: Batch read updates every 2 seconds
- **Memory**: Limit typing/online sets to active conversations
- **Reconnection**: Auto-reconnect with exponential backoff

---

## Security Checklist

- [ ] Validate JWT token in Socket.IO middleware
- [ ] Verify user can only access own conversations
- [ ] Rate-limit message sends (max 10/second per user)
- [ ] Validate message length (max 1000 chars)
- [ ] Sanitize message text (XSS prevention)
- [ ] Use HTTPS in production
- [ ] Use WSS (secure WebSocket) in production
- [ ] Implement CSRF protection if needed

---

## Support

For issues or questions about the chatbox implementation:

1. Review `CHATBOX_ARCHITECTURE.md` for detailed design
2. Check the state and action creators in `Web/src/`
3. Verify Socket.IO event handlers in `Api/src/Socket.ts`
4. Check browser network tab for Socket.IO messages
5. Check server console for error logs

---

**Created:** April 23, 2026  
**Status:** UI/UX & Flow Complete ✓, Database Integration Pending
