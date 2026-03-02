import * as API from "../../../../../Core/Api/Auth/Voucher/delete"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthSeller } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  urlParams: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = urlParams

  const existingVoucher = await VoucherRow.getByID(id)

  if (
    existingVoucher == null ||
    existingVoucher.sellerId.unwrap() !== seller.id.unwrap()
  ) {
    return err("VOUCHER_NOT_FOUND")
  }

  if (existingVoucher.usedCount.unwrap() > 0) {
    return err("VOUCHER_CANNOT_BE_DELETED")
  }

  const isDeleted = await VoucherRow.softDelete(id, seller.id)

  if (!isDeleted) {
    return err("VOUCHER_NOT_FOUND")
  }

  return ok({ id })
}
