import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  // Rename legacy voucher columns to match current API/domain model.
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'expiryDate'
      ) THEN
        ALTER TABLE voucher RENAME COLUMN "expiryDate" TO "expiredDate";
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'discountValue'
      ) THEN
        ALTER TABLE voucher RENAME COLUMN "discountValue" TO "discount";
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'minProductValue'
      ) THEN
        ALTER TABLE voucher RENAME COLUMN "minProductValue" TO "minOrderValue";
      END IF;
    END
    $$;
  `.execute(db)

  // Add missing fields expected by the current voucher logic.
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'active'
      ) THEN
        ALTER TABLE voucher ADD COLUMN "active" boolean NOT NULL DEFAULT true;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'limit'
      ) THEN
        ALTER TABLE voucher ADD COLUMN "limit" integer NOT NULL DEFAULT 1;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'usedCount'
      ) THEN
        ALTER TABLE voucher ADD COLUMN "usedCount" integer NOT NULL DEFAULT 0;
      END IF;
    END
    $$;
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'usedCount'
      ) THEN
        ALTER TABLE voucher DROP COLUMN "usedCount";
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'limit'
      ) THEN
        ALTER TABLE voucher DROP COLUMN "limit";
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'active'
      ) THEN
        ALTER TABLE voucher DROP COLUMN "active";
      END IF;
    END
    $$;
  `.execute(db)

  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'expiredDate'
      ) THEN
        ALTER TABLE voucher RENAME COLUMN "expiredDate" TO "expiryDate";
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'discount'
      ) THEN
        ALTER TABLE voucher RENAME COLUMN "discount" TO "discountValue";
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'voucher' AND column_name = 'minOrderValue'
      ) THEN
        ALTER TABLE voucher RENAME COLUMN "minOrderValue" TO "minProductValue";
      END IF;
    END
    $$;
  `.execute(db)
}
