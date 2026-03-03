import { Voucher } from "../../../Core/App/Voucher"
import { VoucherRow } from "../Database/VoucherRow"

export function toVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id,
    sellerID: row.sellerId,
    active: row.active,
    code: row.code,
    discount: row.discount,
    expiredDate: row.expiredDate,
    limit: row.limit,
    minOrderValue: row.minOrderValue,
    name: row.name,
    usedCount: row.usedCount,
  }
}
