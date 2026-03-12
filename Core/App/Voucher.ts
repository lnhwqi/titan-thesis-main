import * as JD from "decoders"
import { VoucherID, voucherIDDecoder } from "./Voucher/VoucherID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"

import { Active, activeDecoder } from "./Voucher/VoucherActive"
import { VoucherCode, voucherCodeDecoder } from "./Voucher/VoucherCode"
import {
  VoucherDiscount,
  voucherDiscountDecoder,
} from "./Voucher/VoucherDiscount"
import { ExpiredDate, expiredDateDecoder } from "./Voucher/VoucherExpiredDate"
import { UsageLimit, usageLimitDecoder } from "./Voucher/VoucherLimit"
import {
  minOrderValueDecoder,
  MinOrderValue,
} from "./Voucher/VoucherMinOrderValue"
import { VoucherName, voucherNameDecoder } from "./Voucher/VoucherName"
import { UsedCount, usedCountDecoder } from "./Voucher/VoucherUsedCount"

export type Voucher = {
  id: VoucherID
  sellerID: SellerID
  active: Active
  code: VoucherCode
  discount: VoucherDiscount
  expiredDate: ExpiredDate
  limit: UsageLimit
  minOrderValue: MinOrderValue
  name: VoucherName
  usedCount: UsedCount
}

export const voucherDecoder: JD.Decoder<Voucher> = JD.object({
  id: voucherIDDecoder,
  sellerID: sellerIDDecoder,
  active: activeDecoder,
  code: voucherCodeDecoder,
  discount: voucherDiscountDecoder,
  expiredDate: expiredDateDecoder,
  limit: usageLimitDecoder,
  minOrderValue: minOrderValueDecoder,
  name: voucherNameDecoder,
  usedCount: usedCountDecoder,
})
