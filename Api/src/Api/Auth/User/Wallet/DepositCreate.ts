import * as crypto from "crypto"
import * as API from "../../../../../../Core/Api/Auth/User/Wallet/DepositCreate"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import db from "../../../../Database"
import ENV from "../../../../Env"
import { createNow, toDate } from "../../../../../../Core/Data/Time/Timestamp"
import { createUUID } from "../../../../../../Core/Data/UUID"
import * as Logger from "../../../../Logger"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (!user.active.unwrap()) {
    return err("ACCOUNT_SUSPENDED")
  }

  const amount = Math.floor(params.amount)
  if (Number.isFinite(amount) === false || amount <= 0) {
    return err("INVALID_AMOUNT")
  }

  const appTransID = `${formatYYMMDDVN(new Date())}_${Date.now()}`
  const appTime = Date.now()
  const embedData = JSON.stringify({
    merchant: "titan",
    appTransID,
    type: "WALLET_DEPOSIT",
  })
  const item = JSON.stringify([
    {
      type: "wallet_deposit",
      amount,
      userID: user.id.unwrap(),
    },
  ])

  const hmacInput = [
    ENV.ZALO_APP_ID,
    appTransID,
    user.id.unwrap(),
    String(amount),
    String(appTime),
    embedData,
    item,
  ].join("|")

  const mac = crypto
    .createHmac("sha256", ENV.ZALO_KEY1)
    .update(hmacInput)
    .digest("hex")

  const form = new URLSearchParams()
  form.set("app_id", ENV.ZALO_APP_ID)
  form.set("app_user", user.id.unwrap())
  form.set("app_trans_id", appTransID)
  form.set("app_time", String(appTime))
  form.set("amount", String(amount))
  form.set("item", item)
  form.set("embed_data", embedData)
  form.set("description", `Titan Wallet Deposit #${appTransID}`)
  form.set("bank_code", "")
  form.set("mac", mac)

  const response = await fetch(ENV.ZALO_CREATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  }).catch(() => null)

  if (response == null) {
    return err("CREATE_FAILED")
  }

  const rawData: unknown = await response.json().catch(() => null)
  if (typeof rawData !== "object" || rawData === null) {
    Logger.warn("Wallet deposit create response is not a valid JSON object")
    return err("CREATE_FAILED")
  }

  const returnCodeRaw = Reflect.get(rawData, "return_code")
  const returnCode =
    typeof returnCodeRaw === "number"
      ? returnCodeRaw
      : typeof returnCodeRaw === "string"
        ? Number(returnCodeRaw)
        : NaN
  const orderURL = Reflect.get(rawData, "order_url")
  const qrCode = Reflect.get(rawData, "qr_code")
  const zpTransToken = Reflect.get(rawData, "zp_trans_token")

  if (returnCode !== 1 || typeof orderURL !== "string") {
    return err("CREATE_FAILED")
  }

  const now = toDate(createNow())
  await db
    .insertInto("wallet_deposit")
    .values({
      id: createUUID().unwrap(),
      appTransID,
      userId: user.id.unwrap(),
      amount,
      status: "PENDING",
      creditedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .execute()

  return ok({
    appTransID,
    orderURL,
    qrCode: typeof qrCode === "string" ? qrCode : orderURL,
    zpTransToken: typeof zpTransToken === "string" ? zpTransToken : "",
  })
}

function formatYYMMDDVN(d: Date): string {
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  const yy = String(vn.getUTCFullYear()).slice(-2)
  const mm = String(vn.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(vn.getUTCDate()).padStart(2, "0")
  return `${yy}${mm}${dd}`
}
