import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  // Conversation table: one row per 1-on-1 conversation between two parties
  await db.schema
    .createTable("conversation")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("user1Id", "varchar(36)", (col) => col.notNull())
    .addColumn("user1Type", "varchar(10)", (col) => col.notNull()) // USER | SELLER
    .addColumn("user2Id", "varchar(36)", (col) => col.notNull())
    .addColumn("user2Type", "varchar(10)", (col) => col.notNull()) // USER | SELLER
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // Unique constraint: only one conversation between the same pair
  await db.schema
    .createIndex("conversation_pair_idx")
    .on("conversation")
    .columns(["user1Id", "user2Id"])
    .unique()
    .execute()

  await db.schema
    .createIndex("conversation_user1Id_idx")
    .on("conversation")
    .column("user1Id")
    .execute()

  await db.schema
    .createIndex("conversation_user2Id_idx")
    .on("conversation")
    .column("user2Id")
    .execute()

  // Message table
  await db.schema
    .createTable("conversation_message")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("conversationId", "varchar(36)", (col) =>
      col.notNull().references("conversation.id").onDelete("cascade"),
    )
    .addColumn("senderId", "varchar(36)", (col) => col.notNull())
    .addColumn("senderType", "varchar(10)", (col) => col.notNull()) // USER | SELLER | SYSTEM
    .addColumn("senderName", "varchar(255)", (col) => col.notNull())
    .addColumn("text", "text", (col) => col.notNull())
    .addColumn("readAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createIndex("conversation_message_conversationId_idx")
    .on("conversation_message")
    .column("conversationId")
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("conversation_message").execute()
  await db.schema.dropTable("conversation").execute()
}
