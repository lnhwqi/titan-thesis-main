import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { percentDecoder } from "../../Data/Number/Percent"

const key: unique symbol = Symbol()
export type VoucherDiscount = Opaque<number, typeof key>
export type ErrorVoucherDiscount = "INVALID_VOUCHER_DISCOUNT"

export function createVoucherDiscount(s: number): Maybe<VoucherDiscount> {
  return toMaybe(createVoucherDiscountE(s))
}

export function createVoucherDiscountE(
  s: number,
): Result<ErrorVoucherDiscount, VoucherDiscount> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorVoucherDiscount, number> {
  try {
    const percentValue = percentDecoder.verify(s)
    return ok(percentValue.unwrap())
  } catch {
    return err("INVALID_VOUCHER_DISCOUNT")
  }
}

export const voucherDiscountDecoder: JD.Decoder<VoucherDiscount> =
  percentDecoder.transform((percent) =>
    jsonValueCreate<number, typeof key>(key)(percent.unwrap()),
  )
