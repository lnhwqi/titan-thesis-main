import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`create extension if not exists vector`.execute(db)

  await db.schema
    .createTable("ai_vector_document")
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("sourceTable", "varchar(120)", (col) => col.notNull())
    .addColumn("sourceRowId", "varchar(120)", (col) => col.notNull())
    .addColumn("sourceUpdatedAt", "timestamp", (col) => col.notNull())
    .addColumn("chunkIndex", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("contentHash", "varchar(64)", (col) => col.notNull())
    .addColumn("scope", "varchar(30)", (col) => col.notNull())
    .addColumn("participantUserIds", sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`ARRAY[]::text[]`),
    )
    .addColumn("participantSellerIds", sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`ARRAY[]::text[]`),
    )
    .addColumn("metadata", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .addColumn("embedding", sql`vector(768)`)
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createIndex("ai_vector_document_source_chunk_uidx")
    .on("ai_vector_document")
    .columns(["sourceTable", "sourceRowId", "chunkIndex"])
    .unique()
    .execute()

  await db.schema
    .createIndex("ai_vector_document_scope_idx")
    .on("ai_vector_document")
    .column("scope")
    .execute()

  await db.schema
    .createIndex("ai_vector_document_source_updated_idx")
    .on("ai_vector_document")
    .column("sourceUpdatedAt")
    .execute()

  await db.schema
    .createIndex("ai_vector_document_content_hash_idx")
    .on("ai_vector_document")
    .column("contentHash")
    .execute()

  await sql`
    create index ai_vector_document_participant_user_ids_gin_idx
    on ai_vector_document
    using gin ("participantUserIds")
  `.execute(db)

  await sql`
    create index ai_vector_document_participant_seller_ids_gin_idx
    on ai_vector_document
    using gin ("participantSellerIds")
  `.execute(db)

  await sql`
    create index ai_vector_document_embedding_ivfflat_idx
    on ai_vector_document
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100)
  `.execute(db)

  await db.schema
    .createTable("ai_ingestion_checkpoint")
    .addColumn("tableName", "varchar(120)", (col) => col.primaryKey())
    .addColumn("lastSourceUpdatedAt", "timestamp")
    .addColumn("lastRunAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("ai_ingestion_checkpoint").execute()
  await db.schema.dropTable("ai_vector_document").execute()
}
