import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("poster")
    .addColumn("eventContent", "text", (col) =>
      col.notNull().defaultTo(sql`''`),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("poster").dropColumn("eventContent").execute()
}
