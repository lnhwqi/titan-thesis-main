import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("productImage")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("productID", "varchar(36)", (col) =>
      col.notNull().references("product.id").onDelete("cascade"),
    )
    .addColumn("url", "text", (col) => col.notNull())
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("productImage").execute()
}
