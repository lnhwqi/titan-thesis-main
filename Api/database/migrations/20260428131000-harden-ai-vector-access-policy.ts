import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    alter table ai_vector_document
    add column if not exists "ownerId" varchar(36)
  `.execute(db)

  await sql`
    alter table ai_vector_document
    add column if not exists "shopId" varchar(36)
  `.execute(db)

  await sql`
    create index if not exists ai_vector_document_owner_id_idx
    on ai_vector_document ("ownerId")
  `.execute(db)

  await sql`
    create index if not exists ai_vector_document_shop_id_idx
    on ai_vector_document ("shopId")
  `.execute(db)

  await sql`
    create index if not exists ai_vector_document_scope_owner_idx
    on ai_vector_document (scope, "ownerId")
  `.execute(db)

  await sql`
    create index if not exists ai_vector_document_scope_shop_idx
    on ai_vector_document (scope, "shopId")
  `.execute(db)

  await sql`
    update ai_vector_document
    set "ownerId" = nullif("participantUserIds"[1], '')
    where "ownerId" is null
      and array_length("participantUserIds", 1) > 0
  `.execute(db)

  await sql`
    update ai_vector_document
    set "shopId" = nullif("participantSellerIds"[1], '')
    where "shopId" is null
      and array_length("participantSellerIds", 1) > 0
  `.execute(db)

  await sql`
    update ai_vector_document
    set scope = 'ADMIN_PRIVATE'
    where scope = 'ADMIN_INTERNAL'
  `.execute(db)

  await sql`
    update ai_vector_document
    set scope = 'USER_PRIVATE'
    where scope = 'PARTICIPANT_PRIVATE'
      and "ownerId" is not null
      and "shopId" is null
  `.execute(db)

  await sql`
    update ai_vector_document
    set scope = 'SELLER_PRIVATE'
    where scope = 'PARTICIPANT_PRIVATE'
      and "ownerId" is null
      and "shopId" is not null
  `.execute(db)

  await sql`
    update ai_vector_document
    set scope = 'ADMIN_PRIVATE'
    where scope = 'PARTICIPANT_PRIVATE'
  `.execute(db)

  await db.schema
    .createTable("ai_ingestion_dead_letter")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (col) => col.primaryKey())
    .addColumn("sourceTable", "varchar(120)", (col) => col.notNull())
    .addColumn("sourceRowId", "varchar(120)", (col) => col.notNull())
    .addColumn("chunkIndex", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("contentHash", "varchar(64)", (col) => col.notNull())
    .addColumn("errorMessage", "text", (col) => col.notNull())
    .addColumn("payload", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .addColumn("retryCount", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("lastTriedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("nextRetryAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await sql`
    create index if not exists ai_ingestion_dead_letter_source_idx
    on ai_ingestion_dead_letter ("sourceTable", "sourceRowId")
  `.execute(db)

  await sql`
    create index if not exists ai_ingestion_dead_letter_retry_idx
    on ai_ingestion_dead_letter ("nextRetryAt")
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    drop index if exists ai_ingestion_dead_letter_retry_idx
  `.execute(db)

  await sql`
    drop index if exists ai_ingestion_dead_letter_source_idx
  `.execute(db)

  await db.schema.dropTable("ai_ingestion_dead_letter").ifExists().execute()

  await sql`
    drop index if exists ai_vector_document_scope_shop_idx
  `.execute(db)

  await sql`
    drop index if exists ai_vector_document_scope_owner_idx
  `.execute(db)

  await sql`
    drop index if exists ai_vector_document_shop_id_idx
  `.execute(db)

  await sql`
    drop index if exists ai_vector_document_owner_id_idx
  `.execute(db)

  await sql`
    alter table ai_vector_document
    drop column if exists "shopId"
  `.execute(db)

  await sql`
    alter table ai_vector_document
    drop column if exists "ownerId"
  `.execute(db)
}
