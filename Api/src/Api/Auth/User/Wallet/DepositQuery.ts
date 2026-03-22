import * as crypto from "crypto"
import * as API from "../../../../../../Core/Api/Auth/User/Wallet/DepositQuery"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import db from "../../../../Database"
import ENV from "../../../../Env"
import { createNow, toDate } from "../../../../../../Core/Data/Time/Timestamp"
import { toUser } from "../../../../App/User"
import * as UserRow from "../../../../Database/UserRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const deposit = await db
    .selectFrom("wallet_deposit")
    .selectAll()
    .where("appTransID", "=", params.appTransID)
    .where("userId", "=", user.id.unwrap())
    .executeTakeFirst()

  if (deposit == null) {
    return err("DEPOSIT_NOT_FOUND")
  }

  const hmacInput = `${ENV.ZALO_APP_ID}|${params.appTransID}|${ENV.ZALO_KEY1}`
  const mac = crypto
    .createHmac("sha256", ENV.ZALO_KEY1)
    .update(hmacInput)
    .digest("hex")

  const form = new URLSearchParams()
  form.set("app_id", ENV.ZALO_APP_ID)
  form.set("app_trans_id", params.appTransID)
  form.set("mac", mac)

  const response = await fetch(ENV.ZALO_QUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  }).catch(() => null)

  if (response == null) {
    return err("QUERY_FAILED")
  }

  const data: unknown = await response.json().catch(() => null)
  if (typeof data !== "object" || data === null) {
    return err("QUERY_FAILED")
  }

  const returnCode = Reflect.get(data, "return_code")
  const returnMessage = Reflect.get(data, "return_message")

  if (typeof returnCode !== "number") {
    return err("QUERY_FAILED")
  }

  const status: API.DepositStatus =
    returnCode === 1 ? "SUCCESS" : returnCode === 3 ? "PENDING" : "FAILED"

  const now = toDate(createNow())

  if (status === "SUCCESS" && deposit.creditedAt == null) {
    await db.transaction().execute(async (trx) => {
      const lockDeposit = await trx
        .selectFrom("wallet_deposit")
        .selectAll()
        .where("appTransID", "=", params.appTransID)
        .where("userId", "=", user.id.unwrap())
        .forUpdate()
        .executeTakeFirst()

      if (lockDeposit == null || lockDeposit.creditedAt != null) {
        return
      }

      await trx
        .updateTable("user")
        .set((eb) => ({
          wallet: eb("wallet", "+", lockDeposit.amount),
          updatedAt: now,
        }))
        .where("id", "=", user.id.unwrap())
        .where("isDeleted", "=", false)
        .executeTakeFirst()

      await trx
        .updateTable("wallet_deposit")
        .set({
          status: "SUCCESS",
          creditedAt: now,
          updatedAt: now,
        })
        .where("id", "=", lockDeposit.id)
        .executeTakeFirst()
    })
  }

  if (status === "FAILED") {
    await db
      .updateTable("wallet_deposit")
      .set({
        status: "FAILED",
        updatedAt: now,
      })
      .where("appTransID", "=", params.appTransID)
      .where("userId", "=", user.id.unwrap())
      .where("status", "=", "PENDING")
      .executeTakeFirst()
  }

  const refreshed = await UserRow.getByID(user.id)
  if (refreshed == null) {
    return err("DEPOSIT_NOT_FOUND")
  }

  return ok({
    status,
    returnCode,
    returnMessage: typeof returnMessage === "string" ? returnMessage : "",
    user: toUser(refreshed),
  })
}
