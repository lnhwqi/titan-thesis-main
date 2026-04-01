import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("report")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("sellerId", "varchar(36)", (col) =>
      col.notNull().references("seller.id").onDelete("cascade"),
    )
    .addColumn("userId", "varchar(36)", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("orderId", "varchar(36)", (col) =>
      col.notNull().references("order_payment.id").onDelete("cascade"),
    )
    .addColumn("category", "varchar(40)", (col) => col.notNull())
    .addColumn("title", "varchar(100)", (col) => col.notNull())
    .addColumn("userDescription", "varchar(1024)", (col) => col.notNull())
    .addColumn("userUrlImgs", sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`'{}'::text[]`),
    )
    .addColumn("sellerDescription", "varchar(1024)")
    .addColumn("sellerUrlImgs", sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`'{}'::text[]`),
    )
    .addColumn("status", "varchar(40)", (col) => col.notNull())
    .addColumn("resultTextAdmin", "varchar(1024)")
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("report").execute()
}
