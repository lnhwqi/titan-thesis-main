import { Opaque, jsonValueCreate } from "../Data/Opaque"
import { UserID, userIDDecoder } from "./User/UserID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import * as JD from "decoders"

// Define unique symbols for branded types
const messageIDKey: unique symbol = Symbol()
const conversationIDKey: unique symbol = Symbol()
const messageTextKey: unique symbol = Symbol()

export type MessageID = Opaque<string, typeof messageIDKey>
export type ConversationID = Opaque<string, typeof conversationIDKey>
export type MessageText = Opaque<string, typeof messageTextKey>

export type SenderType = "USER" | "SELLER" | "SYSTEM"

export type Message = {
  id: MessageID
  conversationID: ConversationID
  senderID: UserID | SellerID | "SYSTEM"
  senderType: SenderType
  senderName: string
  text: MessageText
  readAt: Date | null
  createdAt: Date
}

export type Conversation = {
  id: ConversationID
  participantIDs: UserID | SellerID
  participantName: string
  lastMessage: Message | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

export type MessageListPayload = {
  messages: Message[]
  page: number
  limit: number
  totalCount: number
  conversationID: ConversationID
}

const jsDateDecoder: JD.Decoder<Date> = JD.either(
  JD.date,
  JD.string.transform((value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${value}`)
    }
    return parsed
  }),
)

// Constructor functions (instead of type assertions)
function createMessageID(id: string): MessageID {
  return jsonValueCreate<string, typeof messageIDKey>(messageIDKey)(id)
}

function createConversationID(id: string): ConversationID {
  return jsonValueCreate<string, typeof conversationIDKey>(conversationIDKey)(
    id,
  )
}

function createMessageText(text: string): MessageText {
  return jsonValueCreate<string, typeof messageTextKey>(messageTextKey)(text)
}

// Decoders
export const messageIDDecoder: JD.Decoder<MessageID> = JD.string
  .describe("INVALID_MESSAGE_ID")
  .transform(createMessageID)

export const conversationIDDecoder: JD.Decoder<ConversationID> = JD.string
  .describe("INVALID_CONVERSATION_ID")
  .transform(createConversationID)

export const messageTextDecoder: JD.Decoder<MessageText> = JD.string
  .describe("INVALID_MESSAGE_TEXT")
  .transform(createMessageText)

export const senderTypeDecoder: JD.Decoder<SenderType> = JD.oneOf([
  "USER",
  "SELLER",
  "SYSTEM",
])

export const messageDecoder: JD.Decoder<Message> = JD.object({
  id: messageIDDecoder,
  conversationID: conversationIDDecoder,
  senderID: JD.either(
    userIDDecoder,
    JD.either(sellerIDDecoder, JD.constant("SYSTEM")),
  ),
  senderType: senderTypeDecoder,
  senderName: JD.string,
  text: messageTextDecoder,
  readAt: JD.optional(JD.nullable(jsDateDecoder)).transform((date) => date ?? null),
  createdAt: jsDateDecoder,
})

export const conversationDecoder: JD.Decoder<Conversation> = JD.object({
  id: conversationIDDecoder,
  participantIDs: JD.either(userIDDecoder, sellerIDDecoder),
  participantName: JD.string,
  lastMessage: JD.optional(JD.nullable(messageDecoder)).transform(
    (msg) => msg ?? null,
  ),
  unreadCount: JD.number,
  createdAt: jsDateDecoder,
  updatedAt: jsDateDecoder,
})

// Exported constructor functions for use in components
export { createMessageID, createConversationID, createMessageText }
