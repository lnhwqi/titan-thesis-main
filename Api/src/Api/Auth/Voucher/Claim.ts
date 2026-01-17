import * as API from "../../../../../Core/Api/Auth/Voucher/Claim"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = params

  const now = new Date()
  if (now.getMinutes() >= 5) {
    return err("OUT_OF_TIME")
  }

  const voucher = await VoucherRow.getByID(id)
  if (voucher == null) {
    return err("UNAUTHORIZED")
  }

  const myVouchers = await VoucherRow.getByUserID(user.id)
  const isAlreadyOwned = myVouchers.some((v) => v.id.unwrap() === id.unwrap())
  if (isAlreadyOwned) {
    return err("ALREADY_OWNED")
  }

  const success = await VoucherRow.claimVoucher(user.id, id)
  if (!success) {
    return err("OUT_OF_STOCK")
  }

  return ok({ success: true })
}
