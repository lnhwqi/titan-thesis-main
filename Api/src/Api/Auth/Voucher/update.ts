import * as API from "../../../../../Core/Api/Auth/Voucher/update"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthSeller } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  urlParams: API.UrlParams,
  bodyParams: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = urlParams
  const { name, limit, expiredDate, active } = bodyParams

  if (expiredDate.unwrap() <= Date.now()) {
    return err("INVALID_EXPIRED_DATE")
  }

  const existing = await VoucherRow.getByID(id)
  if (existing == null || existing.sellerId.unwrap() !== seller.id.unwrap()) {
    return err("VOUCHER_NOT_FOUND")
  }

  const updatedRow = await VoucherRow.update(id, seller.id, {
    name,
    limit,
    expiredDate,
    active,
  })

  if (updatedRow == null) {
    return err("VOUCHER_NOT_FOUND")
  }

  return ok({ voucher: toVoucher(updatedRow) })
}
