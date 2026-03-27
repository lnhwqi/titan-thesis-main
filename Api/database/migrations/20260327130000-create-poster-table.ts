import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("poster")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("name", "varchar(120)", (col) => col.notNull())
    .addColumn("description", "varchar(1024)", (col) => col.notNull())
    .addColumn("imageUrl", "varchar(1024)", (col) => col.notNull())
    .addColumn("imageScalePercent", "integer", (col) =>
      col.notNull().defaultTo(100),
    )
    .addColumn("imageOffsetXPercent", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn("imageOffsetYPercent", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn("startDate", "timestamp", (col) => col.notNull())
    .addColumn("endDate", "timestamp")
    .addColumn("isPermanent", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createIndex("poster_isDeleted_startDate_idx")
    .on("poster")
    .columns(["isDeleted", "startDate"])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("poster").execute()
}
