import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .addColumn("isPaid", "boolean", (col) => col.notNull().defaultTo(true))
    .execute()

  await sql`
    update order_payment
    set "isPaid" = true
    where "isPaid" is null
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("order_payment").dropColumn("isPaid").execute()
}
