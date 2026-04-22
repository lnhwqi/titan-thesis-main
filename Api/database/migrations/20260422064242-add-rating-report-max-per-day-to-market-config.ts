import { Kysely } from "kysely"

const tableName = "market_config"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn("ratingReportMaxPerDay", "integer", (col) =>
      col.notNull().defaultTo(5),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .dropColumn("ratingReportMaxPerDay")
    .execute()
}
