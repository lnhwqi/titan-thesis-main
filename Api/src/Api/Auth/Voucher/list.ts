import * as API from "../../../../../Core/Api/Auth/Voucher/list"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthSeller } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.NoUrlParams & API.QueryParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { minDiscount, maxDiscount, isExpired } = params

  const voucherRows = await VoucherRow.getBySellerID(seller.id, {
    minDiscount: minDiscount ?? undefined,
    maxDiscount: maxDiscount ?? undefined,
    isExpired: isExpired ?? undefined,
  })

  return ok({ vouchers: voucherRows.map(toVoucher) })
}
