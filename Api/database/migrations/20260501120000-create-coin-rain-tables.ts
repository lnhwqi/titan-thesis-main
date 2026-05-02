import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  // Stores admin-configured or default coin rain campaigns
  await db.schema
    .createTable("coin_rain_campaign")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("startTime", "timestamp", (col) => col.notNull())
    .addColumn("duration", "integer", (col) => col.notNull()) // seconds
    // Coin pool stored as JSONB: [{ value: number, quantity: number }]
    .addColumn("coinPool", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn("isDefault", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("isActive", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // Tracks individual coin slots (one row per coin unit) for atomic pickup
  await db.schema
    .createTable("coin_rain_coin")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("campaignId", "varchar(36)", (col) =>
      col.notNull().references("coin_rain_campaign.id").onDelete("cascade"),
    )
    .addColumn("value", "integer", (col) => col.notNull())
    // NULL = available, non-null = claimed by that user
    .addColumn("claimedByUserId", "varchar(36)", (col) =>
      col.references("user.id").onDelete("set null"),
    )
    .addColumn("claimedAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createIndex("coin_rain_coin_campaign_claimed_idx")
    .on("coin_rain_coin")
    .columns(["campaignId", "claimedByUserId"])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("coin_rain_coin").execute()
  await db.schema.dropTable("coin_rain_campaign").execute()
}
