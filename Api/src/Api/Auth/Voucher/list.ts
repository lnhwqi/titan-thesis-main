import * as API from "../../../../../Core/Api/Auth/Voucher/list"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthSeller } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler({
  seller,
  bodyParams,
}: {
  seller: AuthSeller
  urlParams: API.NoUrlParams
  bodyParams: API.QueryParams
}): Promise<Result<API.ErrorCode, API.Payload>> {
  if (!bodyParams) {
    const rows = await VoucherRow.getBySellerID(seller.id, {})
    return ok({ vouchers: rows.map(toVoucher) })
  }

  const voucherRows = await VoucherRow.getBySellerID(seller.id, {
    minDiscount: bodyParams.minDiscount ?? undefined,
    maxDiscount: bodyParams.maxDiscount ?? undefined,
    isExpired: bodyParams.isExpired ?? undefined,
  })

  return ok({ vouchers: voucherRows.map(toVoucher) })
}
