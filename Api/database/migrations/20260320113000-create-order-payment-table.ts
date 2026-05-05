import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("order_payment")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("userId", "varchar(36)", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("sellerId", "varchar(36)", (col) =>
      col.notNull().references("seller.id").onDelete("cascade"),
    )
    .addColumn("username", "varchar(100)", (col) => col.notNull())
    .addColumn("address", "varchar(256)", (col) => col.notNull())
    .addColumn("status", "varchar(40)", (col) => col.notNull())
    .addColumn("price", "integer", (col) => col.notNull())
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
  await db.schema.dropTable("order_payment").execute()
}
