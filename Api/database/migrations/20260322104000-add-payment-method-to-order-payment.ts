import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .addColumn("paymentMethod", "text", (col) =>
      col.notNull().defaultTo("ZALOPAY"),
    )
    .execute()

  await sql`
    update order_payment
    set "paymentMethod" = 'ZALOPAY'
    where "paymentMethod" is null
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("order_payment")
    .dropColumn("paymentMethod")
    .execute()
}
