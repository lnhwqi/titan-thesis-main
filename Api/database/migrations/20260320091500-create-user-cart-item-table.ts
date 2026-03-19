import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("user_cart_item")
    .addColumn("userId", "varchar(36)", (col) => col.notNull())
    .addColumn("productId", "varchar(36)", (col) => col.notNull())
    .addColumn("variantId", "varchar(36)", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("createdAt", "timestamp", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) => col.notNull())
    .addPrimaryKeyConstraint("user_cart_item_pkey", [
      "userId",
      "productId",
      "variantId",
    ])
    .addForeignKeyConstraint("user_cart_item_userId_fkey", ["userId"], "user", [
      "id",
    ])
    .addForeignKeyConstraint(
      "user_cart_item_productId_fkey",
      ["productId"],
      "product",
      ["id"],
    )
    .addForeignKeyConstraint(
      "user_cart_item_variantId_fkey",
      ["variantId"],
      "product_variant",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("user_cart_item").execute()
}
