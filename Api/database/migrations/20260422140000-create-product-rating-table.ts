import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("product_rating")
    .addColumn("orderId", "text", (col) => col.notNull())
    .addColumn("productId", "text", (col) => col.notNull())
    .addColumn("userId", "text", (col) => col.notNull())
    .addColumn("score", "integer", (col) => col.notNull())
    .addColumn("feedback", "text")
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(new Date()),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(new Date()),
    )
    .addPrimaryKeyConstraint("product_rating_pk", [
      "orderId",
      "productId",
      "userId",
    ])
    .execute()

  await db.schema
    .createIndex("product_rating_productId_idx")
    .on("product_rating")
    .column("productId")
    .execute()

  await db.schema
    .createIndex("product_rating_userId_idx")
    .on("product_rating")
    .column("userId")
    .execute()

  await db.schema
    .createIndex("product_rating_orderId_idx")
    .on("product_rating")
    .column("orderId")
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("product_rating").execute()
}
