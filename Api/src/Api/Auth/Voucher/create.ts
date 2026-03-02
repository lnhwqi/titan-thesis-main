import * as API from "../../../../../Core/Api/Auth/Voucher/create"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthSeller } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { name, code, discount, minOrderValue, limit, expiredDate } = params

  if (expiredDate.unwrap() <= Date.now()) {
    return err("INVALID_EXPIRED_DATE")
  }

  const existingVoucher = await VoucherRow.getByCode(code)
  if (existingVoucher != null) {
    return err("VOUCHER_CODE_ALREADY_EXISTS")
  }

  const voucherRow = await VoucherRow.create({
    sellerId: seller.id,
    name,
    code,
    discount,
    minOrderValue,
    limit,
    expiredDate,
  })

  return ok({ voucher: toVoucher(voucherRow) })
}
