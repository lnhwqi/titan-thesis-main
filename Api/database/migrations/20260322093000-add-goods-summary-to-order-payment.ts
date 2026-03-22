import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .addColumn("goodsSummary", "text", (col) => col.notNull().defaultTo(""))
    .execute()

  await sql`
    update order_payment
    set "goodsSummary" = ''
    where "goodsSummary" is null
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("order_payment").dropColumn("goodsSummary").execute()
}
