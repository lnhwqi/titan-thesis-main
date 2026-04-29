import { Kysely, sql } from "kysely"

const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"

/**
 * Create a support conversation for every user and seller that doesn't already have one.
 * After this migration every existing user/seller will see "Titan Support" in their chat list
 * immediately — even before they ever open the chatbox.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // ── Users ────────────────────────────────────────────────────────────────────
  // Canonical pair order: lower UUID goes to user1. SUPPORT_PARTICIPANT_ID
  // (00000000-0000-6000-8000-000000000001) is less than most user UUIDs, so it
  // will often be user1. We let the same CASE expression used by canonicalizePair
  // decide the order.
  await sql`
    INSERT INTO conversation ("id", "user1Id", "user1Type", "user2Id", "user2Type", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid(),
      CASE WHEN u.id <= ${SUPPORT_PARTICIPANT_ID} THEN u.id           ELSE ${SUPPORT_PARTICIPANT_ID} END,
      CASE WHEN u.id <= ${SUPPORT_PARTICIPANT_ID} THEN 'USER'::"text" ELSE 'SELLER'::"text"          END,
      CASE WHEN u.id <= ${SUPPORT_PARTICIPANT_ID} THEN ${SUPPORT_PARTICIPANT_ID} ELSE u.id           END,
      CASE WHEN u.id <= ${SUPPORT_PARTICIPANT_ID} THEN 'SELLER'::"text"          ELSE 'USER'::"text" END,
      NOW(),
      NOW()
    FROM "user" u
    WHERE NOT EXISTS (
      SELECT 1 FROM conversation c
      WHERE
        (c."user1Id" = u.id AND c."user2Id" = ${SUPPORT_PARTICIPANT_ID})
        OR (c."user1Id" = ${SUPPORT_PARTICIPANT_ID} AND c."user2Id" = u.id)
    )
  `.execute(db)

  // ── Sellers ──────────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO conversation ("id", "user1Id", "user1Type", "user2Id", "user2Type", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid(),
      CASE WHEN s.id <= ${SUPPORT_PARTICIPANT_ID} THEN s.id            ELSE ${SUPPORT_PARTICIPANT_ID} END,
      CASE WHEN s.id <= ${SUPPORT_PARTICIPANT_ID} THEN 'SELLER'::"text" ELSE 'SELLER'::"text"         END,
      CASE WHEN s.id <= ${SUPPORT_PARTICIPANT_ID} THEN ${SUPPORT_PARTICIPANT_ID} ELSE s.id            END,
      CASE WHEN s.id <= ${SUPPORT_PARTICIPANT_ID} THEN 'SELLER'::"text"          ELSE 'SELLER'::"text" END,
      NOW(),
      NOW()
    FROM "seller" s
    WHERE NOT EXISTS (
      SELECT 1 FROM conversation c
      WHERE
        (c."user1Id" = s.id AND c."user2Id" = ${SUPPORT_PARTICIPANT_ID})
        OR (c."user1Id" = ${SUPPORT_PARTICIPANT_ID} AND c."user2Id" = s.id)
    )
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remove only the backfilled support conversations that have no messages
  // (i.e. empty conversations created by this migration). Do not touch
  // conversations that already had messages — those were created before or
  // have user activity.
  await sql`
    DELETE FROM conversation
    WHERE (
      "user1Id" = ${SUPPORT_PARTICIPANT_ID}
      OR "user2Id" = ${SUPPORT_PARTICIPANT_ID}
    )
    AND id NOT IN (
      SELECT DISTINCT "conversationId" FROM conversation_message
    )
  `.execute(db)
}
