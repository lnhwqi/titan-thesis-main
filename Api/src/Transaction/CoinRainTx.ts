import db from "../Database"
import * as Logger from "../Logger"

export type PickupResult =
  | { success: true; coinId: string; value: number; newBalance: number }
  | {
      success: false
      reason: "COIN_NOT_FOUND" | "COIN_ALREADY_CLAIMED" | "EVENT_NOT_ACTIVE"
    }

/**
 * Atomically claim a coin for a user and credit the coin value to their wallet.
 *
 * Concurrency safety is achieved with a single UPDATE…WHERE that acts as a
 * compare-and-swap:
 *   UPDATE coin_rain_coin
 *   SET claimedByUserId = $userId, claimedAt = now()
 *   WHERE id = $coinId AND claimedByUserId IS NULL
 *
 * PostgreSQL serialises concurrent writes to the same row through its row-level
 * locking, so only the first caller whose UPDATE matches the WHERE will get
 * numUpdatedRows = 1.  Every subsequent caller sees numUpdatedRows = 0 and
 * receives COIN_ALREADY_CLAIMED.
 *
 * Wallet credit happens in the same transaction to guarantee consistency.
 */
export async function claimCoin(
  coinId: string,
  userId: string,
  campaignId: string,
): Promise<PickupResult> {
  try {
    return await db.transaction().execute(async (trx) => {
      // 1. Verify campaign is currently active & within event window
      const campaign = await trx
        .selectFrom("coin_rain_campaign")
        .select(["id", "startTime", "duration", "isActive"])
        .where("id", "=", campaignId)
        .where("isActive", "=", true)
        .executeTakeFirst()

      if (campaign == null) {
        return { success: false, reason: "EVENT_NOT_ACTIVE" }
      }

      const now = new Date()
      const start = new Date(campaign.startTime)
      const end = new Date(start.getTime() + campaign.duration * 1000)

      if (now < start || now > end) {
        return { success: false, reason: "EVENT_NOT_ACTIVE" }
      }

      // 2. Atomic compare-and-swap claim
      const updateResult = await trx
        .updateTable("coin_rain_coin")
        .set({ claimedByUserId: userId, claimedAt: now })
        .where("id", "=", coinId)
        .where("campaignId", "=", campaignId)
        .where("claimedByUserId", "is", null)
        .returning(["id", "value"])
        .executeTakeFirst()

      if (updateResult == null) {
        // Either coin doesn't exist or already claimed
        const coin = await trx
          .selectFrom("coin_rain_coin")
          .select("id")
          .where("id", "=", coinId)
          .executeTakeFirst()

        return {
          success: false,
          reason: coin == null ? "COIN_NOT_FOUND" : "COIN_ALREADY_CLAIMED",
        }
      }

      // 3. Credit wallet (atomic increment to avoid lost-update)
      const updatedUser = await trx
        .updateTable("user")
        .set((eb) => ({ wallet: eb("wallet", "+", updateResult.value) }))
        .where("id", "=", userId)
        .returning("wallet")
        .executeTakeFirstOrThrow()

      return {
        success: true,
        coinId: updateResult.id,
        value: updateResult.value,
        newBalance: updatedUser.wallet,
      }
    })
  } catch (error) {
    Logger.error(error)
    return { success: false, reason: "COIN_NOT_FOUND" }
  }
}
