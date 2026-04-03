import { Kysely, sql } from "kysely"

const tableName = "market_config"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("reportWindowHours", "integer", (col) =>
      col.notNull().defaultTo(72),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await sql`
    INSERT INTO market_config (id, "reportWindowHours")
    VALUES ('default', 72)
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).execute()
}
