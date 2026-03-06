import * as API from "../../../../../Core/Api/Auth/Voucher/revert"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.NoUrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { voucherID } = params

  try {
    await VoucherRow.revertVoucher(user.id, voucherID)

    return ok({
      success: true,
    })
  } catch (_e) {
    return err("VOUCHER_NOT_FOUND")
  }
}
