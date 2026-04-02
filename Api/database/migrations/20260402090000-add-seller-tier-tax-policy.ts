import { Kysely, sql } from "kysely"

const policyTableName = "seller_tier_policy"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("seller")
    .addColumn("tier", "varchar(50)", (col) =>
      col.notNull().defaultTo("bronze"),
    )
    .addColumn("tax", "integer", (col) => col.notNull().defaultTo(10))
    .execute()

  await db.schema
    .createTable(policyTableName)
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("silverProfitThreshold", "integer", (col) =>
      col.notNull().defaultTo(1000),
    )
    .addColumn("goldProfitThreshold", "integer", (col) =>
      col.notNull().defaultTo(5000),
    )
    .addColumn("bronzeTax", "integer", (col) => col.notNull().defaultTo(10))
    .addColumn("silverTax", "integer", (col) => col.notNull().defaultTo(8))
    .addColumn("goldTax", "integer", (col) => col.notNull().defaultTo(5))
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await sql`
    INSERT INTO seller_tier_policy (
      id,
      "silverProfitThreshold",
      "goldProfitThreshold",
      "bronzeTax",
      "silverTax",
      "goldTax"
    ) VALUES (
      'default',
      1000,
      5000,
      10,
      8,
      5
    )
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(policyTableName).ifExists().execute()

  await db.schema
    .alterTable("seller")
    .dropColumn("tax")
    .dropColumn("tier")
    .execute()
}
