import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .addColumn("fee", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("profit", "integer", (col) => col.notNull().defaultTo(0))
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .dropColumn("fee")
    .dropColumn("profit")
    .execute()
}
