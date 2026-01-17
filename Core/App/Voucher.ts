import * as JD from "decoders"
import { VoucherID, voucherIDDecoder } from "./Voucher/VoucherID"
import { Name, nameDecoder } from "./Voucher/Name"
import { ExpiryDate, expiryDateDecoder } from "./Voucher/ExpiryDate"
import { DiscountValue, discountValueDecoder } from "./Voucher/DiscountValue"
import {
  MinProductValue,
  minProductValueDecoder,
} from "./Voucher/MinProductValue"

export type Voucher = {
  id: VoucherID
  name: Name
  expiryDate: ExpiryDate
  discountValue: DiscountValue
  minProductValue: MinProductValue
  isUsed: boolean
}

export const voucherDecoder: JD.Decoder<Voucher> = JD.object({
  id: voucherIDDecoder,
  name: nameDecoder,
  expiryDate: expiryDateDecoder,
  discountValue: discountValueDecoder,
  minProductValue: minProductValueDecoder,
  isUsed: JD.boolean,
})
