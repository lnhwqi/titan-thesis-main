import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE seller
    ADD COLUMN IF NOT EXISTS "shopDescription" varchar(1000) NOT NULL DEFAULT ''
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE seller
    DROP COLUMN IF EXISTS "shopDescription"
  `.execute(db)
}
