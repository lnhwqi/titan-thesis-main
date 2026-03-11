import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  //======================USER=========================

  await db.schema
    .createTable("user")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("email", "varchar(320)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("password", "varchar(255)", (col) => col.notNull())
    .addColumn("wallet", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("points", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("tier", "varchar(50)", (col) =>
      col.notNull().defaultTo("BRONZE"),
    )
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("user_refresh_token")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("userId", "varchar(36)", (col) =>
      col.references("user.id").notNull().onDelete("cascade"),
    )
    .addColumn("previousId", "varchar(36)", (col) => col.notNull())
    .addColumn("previousCreatedAt", "timestamp", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  //======================SELLER=========================

  await db.schema
    .createTable("seller")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("email", "varchar(320)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("password", "varchar(255)", (col) => col.notNull())
    .addColumn("wallet", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("shopName", "varchar(255)", (col) => col.notNull())
    .addColumn("verified", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("vacationMode", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("revenue", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("withdrawn", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("profit", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("seller_refresh_token")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("sellerId", "varchar(36)", (col) =>
      col.references("seller.id").notNull().onDelete("cascade"),
    )
    .addColumn("previousId", "varchar(36)", (col) => col.notNull())
    .addColumn("previousCreatedAt", "timestamp", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  //======================ADMIN=========================

  await db.schema
    .createTable("admin")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("email", "varchar(320)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("password", "varchar(255)", (col) => col.notNull())
    .addColumn("wallet", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("isDeleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("admin_refresh_token")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("adminId", "varchar(36)", (col) =>
      col.references("admin.id").notNull().onDelete("cascade"),
    )
    .addColumn("previousId", "varchar(36)", (col) => col.notNull())
    .addColumn("previousCreatedAt", "timestamp", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await Promise.all([
    db.schema.dropTable("admin_refresh_token").execute(),
    db.schema.dropTable("seller_refresh_token").execute(),
    db.schema.dropTable("user_refresh_token").execute(),
  ])

  await Promise.all([
    db.schema.dropTable("admin").execute(),
    db.schema.dropTable("seller").execute(),
    db.schema.dropTable("user").execute(),
  ])
}
