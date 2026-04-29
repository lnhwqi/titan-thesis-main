import { randomUUID } from "node:crypto"
import db from "../Database"

export type MessageRow = {
  id: string
  conversationId: string
  senderId: string
  senderType: "USER" | "SELLER" | "GUEST" | "SYSTEM"
  senderName: string
  text: string
  readAt: Date | null
  createdAt: Date
}

/**
 * Insert a new message
 */
export async function create(params: {
  conversationId: string
  senderId: string
  senderType: "USER" | "SELLER" | "GUEST" | "SYSTEM"
  senderName: string
  text: string
}): Promise<MessageRow> {
  const id = randomUUID()
  const now = new Date()
  await db
    .insertInto("conversation_message")
    .values({
      id,
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderType: params.senderType,
      senderName: params.senderName,
      text: params.text,
      readAt: null,
      createdAt: now,
    })
    .execute()
  return {
    id,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderType: params.senderType,
    senderName: params.senderName,
    text: params.text,
    readAt: null,
    createdAt: now,
  }
}

/**
 * List messages for a conversation, paginated (newest first → reversed for display)
 */
export async function listForConversation(
  conversationId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ messages: MessageRow[]; totalCount: number }> {
  const offset = (page - 1) * limit

  const [rows, countRow] = await Promise.all([
    db
      .selectFrom("conversation_message")
      .selectAll()
      .where("conversationId", "=", conversationId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute(),
    db
      .selectFrom("conversation_message")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .where("conversationId", "=", conversationId)
      .executeTakeFirst(),
  ])

  // Reverse so oldest is first (chronological display)
  return {
    messages: [...rows].reverse(),
    totalCount: Number(countRow?.count ?? 0),
  }
}

/**
 * Mark a message as read
 */
export async function markRead(messageId: string, readAt: Date): Promise<void> {
  await db
    .updateTable("conversation_message")
    .set({ readAt })
    .where("id", "=", messageId)
    .where("readAt", "is", null)
    .execute()
}

/**
 * Get the latest message for a conversation
 */
export async function getLatest(
  conversationId: string,
): Promise<MessageRow | null> {
  const row = await db
    .selectFrom("conversation_message")
    .selectAll()
    .where("conversationId", "=", conversationId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .executeTakeFirst()
  return row ?? null
}

/**
 * Count unread messages in a conversation for a given reader (not sent by them)
 */
export async function countUnread(
  conversationId: string,
  readerSenderId: string,
): Promise<number> {
  const row = await db
    .selectFrom("conversation_message")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .where("conversationId", "=", conversationId)
    .where("senderId", "!=", readerSenderId)
    .where("readAt", "is", null)
    .executeTakeFirst()
  return Number(row?.count ?? 0)
}
