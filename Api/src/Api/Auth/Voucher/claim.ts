import * as API from "../../../../../Core/Api/Auth/Voucher/claim"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.NoUrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { voucherID } = params

  const claimResult = await VoucherRow.claimVoucher(user.id, voucherID)

  switch (claimResult) {
    case "SUCCESS":
      return ok({ success: true })

    case "NOT_FOUND":
      return err("VOUCHER_NOT_FOUND")

    case "FULLY_CLAIMED":
      return err("VOUCHER_FULLY_CLAIMED")

    case "ALREADY_CLAIMED":
      return err("VOUCHER_ALREADY_CLAIMED")

    case "SYSTEM_ERROR":
      throw new Error("Internal Server Error during voucher claim")

    default:
      return err("VOUCHER_NOT_FOUND")
  }
}
