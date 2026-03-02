import * as API from "../../../../../Core/Api/Auth/Voucher/listMine"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as VoucherRow from "../../../Database/VoucherRow"
import { AuthUser } from "../../AuthApi"
import { toVoucher } from "../../../App/Voucher"

export const contract = API.contract

/**
 * Handler lấy danh sách Voucher trong ví của tôi (đã nhận và chưa dùng)
 */
export async function handler({
  user,
}: {
  user: AuthUser
  urlParams: API.NoUrlParams
  bodyParams: API.NoBodyParams
}): Promise<Result<never, API.Payload>> {
  // 1. Lấy dữ liệu thô (VoucherRow[]) từ Database
  const rows = await VoucherRow.getByUserID(user.id)

  // 2. Sử dụng toVoucher để map từng row thành object Voucher chuẩn cho API
  // toVoucher sẽ unwrap các kiểu Opaque như VoucherID, VoucherName thành string/number
  const vouchers = rows.map(toVoucher)

  // 3. Trả về đúng định dạng { vouchers: Voucher[] } như Contract yêu cầu
  return ok({
    vouchers: vouchers,
  })
}
