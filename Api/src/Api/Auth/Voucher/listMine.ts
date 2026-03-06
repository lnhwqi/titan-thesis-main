import * as API from "../../../../../Core/Api/Auth/Voucher/listMine"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<never, API.Payload>> {
  const rows = await VoucherRow.getByUserID(user.id)

  const vouchers = rows.map(toVoucher)

  return ok({
    vouchers: vouchers,
  })
}
