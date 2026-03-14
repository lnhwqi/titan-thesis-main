import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("productCategory")
    .addColumn("productID", "varchar(36)", (col) =>
      col.notNull().references("product.id").onDelete("cascade"),
    )
    .addColumn("categoryID", "varchar(36)", (col) =>
      col.notNull().references("category.id").onDelete("cascade"),
    )
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) => col.notNull())
    .addPrimaryKeyConstraint("productCategory_pk", ["productID", "categoryID"])
    .execute()

  await db.schema
    .createTable("product_variant")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("productId", "varchar(36)", (col) =>
      col.notNull().references("product.id").onDelete("cascade"),
    )
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("sku", "varchar(100)", (col) => col.notNull())
    .addColumn("price", "integer", (col) => col.notNull())
    .addColumn("stock", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) => col.notNull())
    .addUniqueConstraint("product_variant_sku_unique", ["sku"])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("product_variant").execute()
  await db.schema.dropTable("productCategory").execute()
}
