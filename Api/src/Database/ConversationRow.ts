import { randomUUID } from "node:crypto"
import { sql } from "kysely"
import db from "../Database"

export type ConversationRow = {
  id: string
  user1Id: string
  user1Type: "USER" | "SELLER"
  user2Id: string
  user2Type: "USER" | "SELLER"
  createdAt: Date
  updatedAt: Date
}

/**
 * Find existing conversation between two parties (order-independent)
 */
export async function findBetween(
  aId: string,
  bId: string,
): Promise<ConversationRow | null> {
  const row = await db
    .selectFrom("conversation")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb.and([eb("user1Id", "=", aId), eb("user2Id", "=", bId)]),
        eb.and([eb("user1Id", "=", bId), eb("user2Id", "=", aId)]),
      ]),
    )
    .executeTakeFirst()
  return row ?? null
}

/**
 * Find conversation by id
 */
export async function findById(id: string): Promise<ConversationRow | null> {
  const row = await db
    .selectFrom("conversation")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
  return row ?? null
}

/**
 * List all conversations for a given user/seller id
 */
export async function listForUser(userId: string): Promise<ConversationRow[]> {
  return db
    .selectFrom("conversation")
    .selectAll()
    .where((eb) =>
      eb.or([eb("user1Id", "=", userId), eb("user2Id", "=", userId)]),
    )
    .orderBy("updatedAt", "desc")
    .execute()
}

/**
 * Create a new conversation between two parties
 */
export async function create(
  user1Id: string,
  user1Type: "USER" | "SELLER",
  user2Id: string,
  user2Type: "USER" | "SELLER",
): Promise<ConversationRow> {
  const id = randomUUID()
  const now = new Date()
  await db
    .insertInto("conversation")
    .values({
      id,
      user1Id,
      user1Type,
      user2Id,
      user2Type,
      createdAt: now,
      updatedAt: now,
    })
    .execute()
  return { id, user1Id, user1Type, user2Id, user2Type, createdAt: now, updatedAt: now }
}

/**
 * Bump updatedAt when a new message is sent
 */
export async function touch(conversationId: string): Promise<void> {
  await db
    .updateTable("conversation")
    .set({ updatedAt: sql`now()` })
    .where("id", "=", conversationId)
    .execute()
}
