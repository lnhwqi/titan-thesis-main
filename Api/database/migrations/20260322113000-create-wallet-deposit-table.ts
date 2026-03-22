import { Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("wallet_deposit")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("appTransID", "text", (col) => col.notNull().unique())
    .addColumn("userId", "text", (col) => col.notNull())
    .addColumn("amount", "integer", (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull().defaultTo("PENDING"))
    .addColumn("creditedAt", "timestamptz")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(new Date()),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(new Date()),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("wallet_deposit").execute()
}
