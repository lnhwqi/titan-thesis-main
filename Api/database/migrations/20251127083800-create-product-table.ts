import { Kysely, sql } from "kysely" // Nhớ import thêm 'sql' để gán giá trị mặc định cho JSONB

// Why `unknown`? Read more here https://kysely.dev/docs/migrations
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("product")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())

    .addColumn("sellerId", "varchar(36)", (col) => col.notNull())
    .addColumn("categoryId", "varchar(36)", (col) => col.notNull())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("price", "integer", (col) => col.notNull())
    .addColumn("description", "text", (col) => col.notNull())
    .addColumn("stock", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("attributes", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )

    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // DEPRECATE We don't rollback database except during development
  // Once a migration is deployed on production,
  // we should revert this rollback to
  // throw new Error(
  //   "Do not rollback database. Push another migration to fix database migration.",
  // )

  await db.schema.dropTable("product").execute()
}
