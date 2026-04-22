import * as API from "../../../../../Core/Api/Auth/Admin/Stats"

import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import db from "../../../Database"
import { natDecoder } from "../../../../../Core/Data/Number/Nat"
import * as Logger from "../../../Logger"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  try {
    // Get total users
    const totalUsersResult = await db
      .selectFrom("user")
      .select((b) => b.fn.count("id").as("total"))
      .where("isDeleted", "=", false)
      .executeTakeFirst()
    const totalUsers = natDecoder.verify(Number(totalUsersResult?.total ?? 0))

    // Get new users in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const newUsersResult = await db
      .selectFrom("user")
      .select((b) => b.fn.count("id").as("total"))
      .where("isDeleted", "=", false)
      .where("createdAt", ">=", sevenDaysAgo)
      .executeTakeFirst()
    const newUsers = natDecoder.verify(Number(newUsersResult?.total ?? 0))

    // Get total sellers
    const totalSellersResult = await db
      .selectFrom("seller")
      .select((b) => b.fn.count("id").as("total"))
      .where("isDeleted", "=", false)
      .executeTakeFirst()
    const totalSellers = natDecoder.verify(
      Number(totalSellersResult?.total ?? 0),
    )

    // Get new sellers in the last 7 days
    const sevenDaysAgoForSellers = new Date()
    sevenDaysAgoForSellers.setDate(sevenDaysAgoForSellers.getDate() - 7)

    const newSellersResult = await db
      .selectFrom("seller")
      .select((b) => b.fn.count("id").as("total"))
      .where("isDeleted", "=", false)
      .where("createdAt", ">=", sevenDaysAgoForSellers)
      .executeTakeFirst()
    const newSellers = natDecoder.verify(Number(newSellersResult?.total ?? 0))

    // Get daily financial data for last 30 days
    const dailyFinancialData: API.DailyFinancialData[] = []

    for (let i = 29; i >= 0; i--) {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() - i)
      currentDate.setHours(0, 0, 0, 0)

      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 1)

      // Get deposits for this day
      const dailyDepositsResult = await db
        .selectFrom("wallet_deposit")
        .select((b) => b.fn.sum("amount").as("total"))
        .where("status", "=", "SUCCESS")
        .where("creditedAt", ">=", currentDate)
        .where("creditedAt", "<", nextDate)
        .executeTakeFirst()
      const dailyDeposits = Number(dailyDepositsResult?.total ?? 0)

      // Get orders paid for this day
      const dailyOrdersResult = await db
        .selectFrom("order_payment")
        .select((b) => b.fn.sum("price").as("total"))
        .where("status", "in", ["PAID", "DELIVERED", "RECEIVED"])
        .where("createdAt", ">=", currentDate)
        .where("createdAt", "<", nextDate)
        .executeTakeFirst()
      const dailyOrders = Number(dailyOrdersResult?.total ?? 0)

      // Get total remaining balance at this point
      const remainingResult = await db
        .selectFrom("user")
        .select((b) => b.fn.sum("wallet").as("total"))
        .where("isDeleted", "=", false)
        .executeTakeFirst()
      const remaining = Number(remainingResult?.total ?? 0)

      const dateStr = currentDate.toISOString().split("T")[0]

      dailyFinancialData.push({
        date: dateStr,
        totalDeposited: natDecoder.verify(dailyDeposits),
        totalUsed: natDecoder.verify(dailyOrders),
        remaining: natDecoder.verify(remaining),
      })
    }

    return ok({
      totalUsers,
      newUsers,
      totalSellers,
      newSellers,
      dailyFinancialData,
    })
  } catch (e) {
    Logger.error(`#admin.stats error ${e}`)
    throw e
  }
}
