import { Voucher } from "../../../Core/App/Voucher"
import { VoucherRow } from "../Database/VoucherRow"

export function toVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id,
    name: row.name,
    expiryDate: row.expiryDate,
    discountValue: row.discountValue,
    minProductValue: row.minProductValue,
    isUsed: false,
  }
}
