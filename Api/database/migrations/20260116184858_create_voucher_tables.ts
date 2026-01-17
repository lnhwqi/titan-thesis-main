import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("voucher")
    .addColumn("id", "uuid", (col) => col.primaryKey())
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
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("userId", "uuid", (col) => col.notNull())
    .addColumn("voucherId", "uuid", (col) => col.notNull())
    .addColumn("isUsed", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("usedAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    // Đảm bảo Alice không sở hữu 1 mã voucher 2 lần nếu bạn muốn
    .addUniqueConstraint("unique_user_voucher", ["userId", "voucherId"])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("user_voucher").execute()
  await db.schema.dropTable("voucher").execute()
}
