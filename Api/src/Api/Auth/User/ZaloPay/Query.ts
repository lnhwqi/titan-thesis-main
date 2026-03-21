import * as crypto from "crypto"
import * as API from "../../../../../../Core/Api/Auth/User/ZaloPay/Query"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import ENV from "../../../../Env"

export const contract = API.contract

export async function handler(
  _user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
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

  const status: API.ZaloPaymentStatus =
    returnCode === 1 ? "SUCCESS" : returnCode === 3 ? "PENDING" : "FAILED"

  return ok({
    status,
    returnCode,
    returnMessage: typeof returnMessage === "string" ? returnMessage : "",
  })
}
