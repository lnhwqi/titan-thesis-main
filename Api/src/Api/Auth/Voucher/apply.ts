import * as API from "../../../../../Core/Api/Auth/Voucher/apply"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.NoUrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { voucherID, orderValue } = params

  const result = await VoucherRow.validateForApplying(
    user.id,
    voucherID,
    orderValue,
  )

  switch (result.type) {
    case "SUCCESS":
      return ok({
        success: true,
      })

    case "NOT_FOUND":
      return err("VOUCHER_NOT_FOUND")

    case "EXPIRED":
      return err("VOUCHER_EXPIRED")

    case "ALREADY_USED":
      return err("VOUCHER_ALREADY_USED")

    case "MIN_VALUE_NOT_MET":
      return err("MIN_ORDER_VALUE_NOT_MET")

    default:
      return err("VOUCHER_NOT_FOUND")
  }
}
