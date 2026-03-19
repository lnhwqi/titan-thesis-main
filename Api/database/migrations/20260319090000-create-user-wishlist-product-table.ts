import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("user_wishlist_product")
    .addColumn("userId", "varchar(36)", (col) => col.notNull())
    .addColumn("productId", "varchar(36)", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) => col.notNull())
    .addPrimaryKeyConstraint("user_wishlist_product_pkey", [
      "userId",
      "productId",
    ])
    .addForeignKeyConstraint(
      "user_wishlist_product_userId_fkey",
      ["userId"],
      "user",
      ["id"],
    )
    .addForeignKeyConstraint(
      "user_wishlist_product_productId_fkey",
      ["productId"],
      "product",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("user_wishlist_product").execute()
}
