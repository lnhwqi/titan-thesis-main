import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("ai_support_metrics_snapshot")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("generatedAt", "timestamp", (col) => col.notNull())
    .addColumn("lastEventAt", "timestamp")
    .addColumn("snapshot", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createIndex("ai_support_metrics_snapshot_generated_at_idx")
    .on("ai_support_metrics_snapshot")
    .column("generatedAt")
    .execute()

  await db.schema
    .createIndex("ai_support_metrics_snapshot_created_at_idx")
    .on("ai_support_metrics_snapshot")
    .column("createdAt")
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("ai_support_metrics_snapshot").execute()
}
