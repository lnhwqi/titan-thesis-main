import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .addColumn("isSellerSettled", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("settledAt", "timestamp")
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .dropColumn("settledAt")
    .dropColumn("isSellerSettled")
    .execute()
}
