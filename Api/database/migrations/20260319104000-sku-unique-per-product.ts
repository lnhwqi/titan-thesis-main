import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("product_variant")
    .dropConstraint("product_variant_sku_unique")
    .execute()

  await db.schema
    .alterTable("product_variant")
    .addUniqueConstraint("product_variant_product_sku_unique", [
      "productId",
      "sku",
    ])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("product_variant")
    .dropConstraint("product_variant_product_sku_unique")
    .execute()

  await db.schema
    .alterTable("product_variant")
    .addUniqueConstraint("product_variant_sku_unique", ["sku"])
    .execute()
}
