import * as API from "../../../../../Core/Api/Auth/Voucher/Create" // Adjust path to your actual Core API contract
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow" // Adjust path to your DB Row module
import { AuthAdmin } from "../../AuthApi" // Adjust path based on your admin auth setup

export const contract = API.contract

export async function handler(
  admin: AuthAdmin, // Requires Admin authentication
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const {
    code,
    discountType,
    discountValue,
    minSpend,
    totalQuantity,
    startsAt,
    expiresAt,
  } = params

  // 1. Optional: Validate dates
  if (expiresAt <= startsAt) {
    return err("INVALID_EXPIRATION_DATE") // Ensure this matches your API.ErrorCode union
  }

  // 2. Check if the voucher code already exists
  const existingVoucher = await VoucherRow.getByCode(code)
  if (existingVoucher != null) {
    return err("VOUCHER_CODE_ALREADY_EXISTS")
  }

  // 3. Delegate to the Row module to actually insert the data
  const voucherRow = await VoucherRow.create({
    code,
    discountType,
    discountValue,
    minSpend,
    totalQuantity,
    startsAt,
    expiresAt,
  })

  // 4. Return the successful payload
  return ok({ voucher: voucherRow })
  // Note: if you use a `toVoucher()` mapper like you did with `toUser()`,
  // you would do `return ok({ voucher: toVoucher(voucherRow) })`
}
