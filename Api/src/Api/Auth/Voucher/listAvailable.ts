import * as API from "../../../../../Core/Api/Auth/Voucher/listAvailable"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler({
  user,
}: {
  user: AuthUser
  urlParams: API.NoUrlParams
  bodyParams: API.NoBodyParams
}): Promise<Result<never, API.Payload>> {
  const allAvailableRows = await VoucherRow.getAllAvailable()

  const myVoucherRows = await VoucherRow.getByUserID(user.id)

  const myVoucherIds = new Set(myVoucherRows.map((v) => v.id.unwrap()))

  const filteredVouchers = allAvailableRows
    .filter((row) => !myVoucherIds.has(row.id.unwrap()))
    .map(toVoucher)

  return ok({
    vouchers: filteredVouchers,
  })
}
