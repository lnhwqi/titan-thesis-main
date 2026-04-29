import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  // Drop the old order-sensitive unique index before canonicalizing pairs.
  await sql`DROP INDEX IF EXISTS conversation_pair_idx`.execute(db)

  // Canonicalize all rows so pair ordering is deterministic.
  await sql`
    UPDATE conversation
    SET
      "user1Id" = CASE WHEN "user1Id" <= "user2Id" THEN "user1Id" ELSE "user2Id" END,
      "user1Type" = CASE WHEN "user1Id" <= "user2Id" THEN "user1Type" ELSE "user2Type" END,
      "user2Id" = CASE WHEN "user1Id" <= "user2Id" THEN "user2Id" ELSE "user1Id" END,
      "user2Type" = CASE WHEN "user1Id" <= "user2Id" THEN "user2Type" ELSE "user1Type" END
    WHERE "user1Id" > "user2Id"
  `.execute(db)

  // Merge duplicates for the same canonical pair by keeping the most recently updated row.
  await sql`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY "user1Id", "user2Id"
          ORDER BY "updatedAt" DESC, "createdAt" ASC, id ASC
        ) AS rn,
        FIRST_VALUE(id) OVER (
          PARTITION BY "user1Id", "user2Id"
          ORDER BY "updatedAt" DESC, "createdAt" ASC, id ASC
        ) AS keep_id
      FROM conversation
    )
    UPDATE conversation_message cm
    SET "conversationId" = ranked.keep_id
    FROM ranked
    WHERE cm."conversationId" = ranked.id
      AND ranked.rn > 1
      AND ranked.keep_id <> ranked.id
  `.execute(db)

  await sql`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY "user1Id", "user2Id"
          ORDER BY "updatedAt" DESC, "createdAt" ASC, id ASC
        ) AS rn
      FROM conversation
    )
    DELETE FROM conversation c
    USING ranked
    WHERE c.id = ranked.id
      AND ranked.rn > 1
  `.execute(db)

  // Recreate uniqueness and enforce canonical ordering at DB level.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS conversation_pair_idx
    ON conversation ("user1Id", "user2Id")
  `.execute(db)

  await sql`
    ALTER TABLE conversation
    ADD CONSTRAINT conversation_pair_order_ck
    CHECK ("user1Id" <= "user2Id")
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE conversation
    DROP CONSTRAINT IF EXISTS conversation_pair_order_ck
  `.execute(db)

  await sql`DROP INDEX IF EXISTS conversation_pair_idx`.execute(db)

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS conversation_pair_idx
    ON conversation ("user1Id", "user2Id")
  `.execute(db)
}
