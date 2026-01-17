import * as API from "../../../../../Core/Api/Auth/Voucher/ListVouchersOneUser"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.NoUrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await VoucherRow.getByUserID(user.id)

  const payload = rows.map((row) => toVoucher(row))

  return ok(payload)
}
