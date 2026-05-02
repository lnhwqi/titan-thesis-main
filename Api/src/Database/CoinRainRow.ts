import { randomUUID } from "node:crypto"
import { Selectable } from "kysely"
import db, {
  CoinEntry,
  CoinRainCampaignTable,
  CoinRainCoinTable,
} from "../Database"
import * as Logger from "../Logger"
import {
  CoinRainCampaign,
  coinRainCampaignIDDecoder,
  coinValueDecoder,
} from "../../../Core/App/CoinRain"
import { natDecoder } from "../../../Core/Data/Number/Nat"

export type CoinRainCampaignRow = Selectable<CoinRainCampaignTable>
export type CoinRainCoinRow = Selectable<CoinRainCoinTable>

type CoinInsertValue = {
  id: string
  campaignId: string
  value: number
  claimedByUserId: string | null
  claimedAt: Date | null
  createdAt: Date
}

/** Map a DB row to the Core domain type for API responses */
export function rowToCampaign(row: CoinRainCampaignRow): CoinRainCampaign {
  return {
    id: coinRainCampaignIDDecoder.verify(row.id),
    startTime: row.startTime.toISOString(),
    duration: natDecoder.verify(row.duration),
    coinPool: row.coinPool.map((entry) => ({
      value: coinValueDecoder.verify(entry.value),
      quantity: natDecoder.verify(entry.quantity),
    })),
    isDefault: row.isDefault,
    isActive: row.isActive,
  }
}

// ---------------------------------------------------------------------------
// Campaign helpers
// ---------------------------------------------------------------------------

/** Find the most recent active non-default campaign, or the default one */
export async function findActiveCampaign(): Promise<CoinRainCampaignRow | null> {
  const row = await db
    .selectFrom("coin_rain_campaign")
    .selectAll()
    .where("isActive", "=", true)
    .orderBy("isDefault", "asc") // prefer non-default (isDefault=false) first
    .orderBy("createdAt", "desc")
    .executeTakeFirst()
  return row ?? null
}

/** Find the next scheduled campaign whose startTime is in the future */
export async function findNextCampaign(): Promise<CoinRainCampaignRow | null> {
  const now = new Date()
  const row = await db
    .selectFrom("coin_rain_campaign")
    .selectAll()
    .where("isActive", "=", true)
    .where("startTime", ">", now)
    .orderBy("startTime", "asc")
    .executeTakeFirst()
  return row ?? null
}

/** Find a campaign by id */
export async function findById(
  id: string,
): Promise<CoinRainCampaignRow | null> {
  const row = await db
    .selectFrom("coin_rain_campaign")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
  return row ?? null
}

/** Deactivate all existing non-default campaigns */
export async function deactivateAll(): Promise<void> {
  await db
    .updateTable("coin_rain_campaign")
    .set({ isActive: false, updatedAt: new Date() })
    .where("isDefault", "=", false)
    .execute()
}

/**
 * Upsert the admin-configured campaign.
 * Deactivates any previous custom campaign, then inserts a fresh one.
 * Also creates all individual coin rows for this campaign.
 */
export async function upsertAdminCampaign(params: {
  startTime: Date
  duration: number
  coinPool: CoinEntry[]
}): Promise<CoinRainCampaignRow> {
  const now = new Date()
  const id = randomUUID()

  return db.transaction().execute(async (trx) => {
    // Deactivate previous custom campaigns
    await trx
      .updateTable("coin_rain_campaign")
      .set({ isActive: false, updatedAt: now })
      .where("isDefault", "=", false)
      .execute()

    // Insert new campaign
    const campaign = await trx
      .insertInto("coin_rain_campaign")
      .values({
        id,
        startTime: params.startTime,
        duration: params.duration,
        coinPool: JSON.stringify(params.coinPool),
        isDefault: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Create individual coin rows
    const coins: CoinInsertValue[] = params.coinPool.flatMap((entry) =>
      Array.from(
        { length: entry.quantity },
        (): CoinInsertValue => ({
          id: randomUUID(),
          campaignId: id,
          value: entry.value,
          claimedByUserId: null,
          claimedAt: null,
          createdAt: now,
        }),
      ),
    )

    if (coins.length > 0) {
      await trx.insertInto("coin_rain_coin").values(coins).execute()
    }

    return campaign
  })
}

/**
 * Ensure the system-default campaign exists.
 * Default: every Friday at 20:00, duration 60 s, small pool.
 */
export async function ensureDefaultCampaign(): Promise<void> {
  const existing = await db
    .selectFrom("coin_rain_campaign")
    .select("id")
    .where("isDefault", "=", true)
    .executeTakeFirst()

  if (existing != null) return

  // Next Friday at 20:00 local server time
  const nextFriday = getNextFriday()
  const defaultPool: CoinEntry[] = [
    { value: 1000, quantity: 50 },
    { value: 5000, quantity: 20 },
    { value: 10000, quantity: 5 },
  ]
  const now = new Date()
  const id = randomUUID()

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("coin_rain_campaign")
      .values({
        id,
        startTime: nextFriday,
        duration: 60,
        coinPool: JSON.stringify(defaultPool),
        isDefault: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .execute()

    const coins: CoinInsertValue[] = defaultPool.flatMap((entry) =>
      Array.from(
        { length: entry.quantity },
        (): CoinInsertValue => ({
          id: randomUUID(),
          campaignId: id,
          value: entry.value,
          claimedByUserId: null,
          claimedAt: null,
          createdAt: now,
        }),
      ),
    )

    await trx.insertInto("coin_rain_coin").values(coins).execute()
  })

  Logger.log("CoinRain: default campaign created (next Friday 20:00)")
}

function getNextFriday(): Date {
  const d = new Date()
  // 5 = Friday
  const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntilFriday)
  d.setHours(20, 0, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Coin helpers
// ---------------------------------------------------------------------------

export async function listCoinsForCampaign(
  campaignId: string,
): Promise<CoinRainCoinRow[]> {
  return db
    .selectFrom("coin_rain_coin")
    .selectAll()
    .where("campaignId", "=", campaignId)
    .execute()
}

export async function countAvailableCoins(campaignId: string): Promise<number> {
  const result = await db
    .selectFrom("coin_rain_coin")
    .select((b) => b.fn.count("id").as("total"))
    .where("campaignId", "=", campaignId)
    .where("claimedByUserId", "is", null)
    .executeTakeFirst()
  return Number(result?.total ?? 0)
}
