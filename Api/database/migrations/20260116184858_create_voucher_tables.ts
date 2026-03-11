import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("voucher")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())

    .addColumn("sellerId", "varchar(36)", (col) => col.notNull())

    .addColumn("code", "varchar(50)", (col) => col.notNull().unique())

    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("expiryDate", "timestamp", (col) => col.notNull())
    .addColumn("discountValue", "integer", (col) => col.notNull())
    .addColumn("minProductValue", "integer", (col) => col.notNull())
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("user_voucher")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())

    .addColumn("userId", "varchar(36)", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("voucherId", "varchar(36)", (col) =>
      col.notNull().references("voucher.id").onDelete("cascade"),
    )

    .addColumn("isUsed", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("usedAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addUniqueConstraint("unique_user_voucher", ["userId", "voucherId"])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("user_voucher").execute()
  await db.schema.dropTable("voucher").execute()
}
