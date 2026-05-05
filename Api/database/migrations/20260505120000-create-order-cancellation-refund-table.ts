import type { Kysely } from "kysely"
import { sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("order_cancellation_refund")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("orderID", "varchar(36)", (col) => col.notNull().unique())
    .addColumn("userID", "varchar(36)", (col) => col.notNull())
    .addColumn("amount", "integer", (col) => col.notNull())
    .addColumn("reason", "varchar(50)", (col) =>
      col.notNull().defaultTo("SELLER_CANCEL"),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("order_cancellation_refund").execute()
}
