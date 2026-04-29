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
    .orderBy("updatedAt", "desc")
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
 * List all conversations where any of the given participant IDs are involved.
 * Used by admin to list all support conversations.
 */
export async function listByParticipantIDs(
  participantIDs: string[],
): Promise<ConversationRow[]> {
  if (participantIDs.length === 0) return []
  return db
    .selectFrom("conversation")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("user1Id", "in", participantIDs),
        eb("user2Id", "in", participantIDs),
      ]),
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
  const canonical = canonicalizePair({
    user1Id,
    user1Type,
    user2Id,
    user2Type,
  })

  const id = randomUUID()
  const now = new Date()

  await db
    .insertInto("conversation")
    .values({
      id,
      user1Id: canonical.user1Id,
      user1Type: canonical.user1Type,
      user2Id: canonical.user2Id,
      user2Type: canonical.user2Type,
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((oc) => oc.columns(["user1Id", "user2Id"]).doNothing())
    .execute()

  const existing = await db
    .selectFrom("conversation")
    .selectAll()
    .where("user1Id", "=", canonical.user1Id)
    .where("user2Id", "=", canonical.user2Id)
    .executeTakeFirst()

  if (existing != null) {
    return existing
  }

  const fallback = await findBetween(user1Id, user2Id)
  if (fallback != null) {
    return fallback
  }

  throw new Error("Failed to create conversation")
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

function canonicalizePair(params: {
  user1Id: string
  user1Type: "USER" | "SELLER"
  user2Id: string
  user2Type: "USER" | "SELLER"
}): {
  user1Id: string
  user1Type: "USER" | "SELLER"
  user2Id: string
  user2Type: "USER" | "SELLER"
} {
  if (params.user1Id <= params.user2Id) {
    return params
  }

  return {
    user1Id: params.user2Id,
    user1Type: params.user2Type,
    user2Id: params.user1Id,
    user2Type: params.user1Type,
  }
}
