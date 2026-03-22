import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("order_payment_item")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("orderPaymentId", "varchar(36)", (col) =>
      col.notNull().references("order_payment.id").onDelete("cascade"),
    )
    .addColumn("productId", "varchar(36)", (col) => col.notNull())
    .addColumn("variantId", "varchar(36)", (col) => col.notNull())
    .addColumn("productName", "varchar(256)", (col) => col.notNull())
    .addColumn("variantName", "varchar(100)", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("order_payment_item").execute()
}
