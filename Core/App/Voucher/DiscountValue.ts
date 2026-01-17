import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type DiscountValue = Opaque<number, typeof key>
export type ErrorDiscountValue = "INVALID_DISCOUNT_VALUE"

export function createDiscountValue(n: number): Maybe<DiscountValue> {
  return toMaybe(createDiscountValueE(n))
}

export function createDiscountValueE(
  n: number,
): Result<ErrorDiscountValue, DiscountValue> {
  if (n < 0) return err("INVALID_DISCOUNT_VALUE")
  return ok(jsonValueCreate<number, typeof key>(key)(n))
}

export const discountValueDecoder: JD.Decoder<DiscountValue> =
  JD.number.transform((n) => {
    return throwIfNull(createDiscountValue(n), `Invalid DiscountValue: ${n}`)
  })
