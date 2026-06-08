import * as API from "../../../../../Core/Api/Auth/User/WalletTransactions"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthUser } from "../../AuthApi"
import db from "../../../Database"

export const contract = API.contract

export async function handler(
  user: AuthUser,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const uid = user.id.unwrap()

  // 1. Coin rain pickups
  const coinRows = await db
    .selectFrom("coin_rain_coin")
    .select(["id", "value", "claimedAt"])
    .where("claimedByUserId", "=", uid)
    .where("claimedAt", "is not", null)
    .execute()

  // 2. Successful wallet deposits
  const depositRows = await db
    .selectFrom("wallet_deposit")
    .select(["id", "amount", "creditedAt"])
    .where("userId", "=", uid)
    .where("status", "=", "SUCCESS")
    .where("creditedAt", "is not", null)
    .execute()

  // 3. Orders paid from wallet (deductions)
  const paymentRows = await db
    .selectFrom("order_payment")
    .select(["id", "price", "goodsSummary", "createdAt"])
    .where("userId", "=", uid)
    .where("paymentMethod", "=", "WALLET")
    .where("isPaid", "=", true)
    .where("isDeleted", "=", false)
    .execute()

  // Current wallet balance
  const userRow = await db
    .selectFrom("user")
    .select("wallet")
    .where("id", "=", uid)
    .executeTakeFirst()

  const currentBalance = userRow?.wallet ?? 0

  const transactions: API.WalletTransaction[] = []

  for (const row of coinRows) {
    if (row.claimedAt == null) continue
    transactions.push({
      id: `coin-${row.id}`,
      kind: "COIN_RAIN",
      amount: row.value ?? 0,
      description: "Coin rain pickup",
      occurredAt:
        row.claimedAt instanceof Date
          ? row.claimedAt.toISOString()
          : String(row.claimedAt),
    })
  }

  for (const row of depositRows) {
    if (row.creditedAt == null) continue
    transactions.push({
      id: `deposit-${row.id}`,
      kind: "DEPOSIT",
      amount: row.amount,
      description: "ZaloPay wallet deposit",
      occurredAt:
        row.creditedAt instanceof Date
          ? row.creditedAt.toISOString()
          : String(row.creditedAt),
    })
  }

  for (const row of paymentRows) {
    transactions.push({
      id: `payment-${row.id}`,
      kind: "PAYMENT",
      amount: Number(row.price),
      description:
        row.goodsSummary.length > 60
          ? row.goodsSummary.slice(0, 60) + "…"
          : row.goodsSummary,
      occurredAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : String(row.createdAt),
    })
  }

  // Sort newest first
  transactions.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  const payload = API.payloadDecoder.verify({ transactions, currentBalance })
  return ok(payload)
}
