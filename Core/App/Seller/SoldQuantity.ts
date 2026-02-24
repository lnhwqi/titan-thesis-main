import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type SoldQuantity = Opaque<number, typeof key>
export type ErrorSoldQuantity = "INVALID_SOLD_QUANTITY"

export function createSoldQuantity(s: number): Maybe<SoldQuantity> {
  return toMaybe(createSoldQuantityE(s))
}

export function createSoldQuantityE(
  s: number,
): Result<ErrorSoldQuantity, SoldQuantity> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorSoldQuantity, number> {
  const nonNegInt = createNat(s)

  if (nonNegInt == null) return err("INVALID_SOLD_QUANTITY")
  return ok(nonNegInt.unwrap())
}

export const soldQuantityDecoder: JD.Decoder<SoldQuantity> =
  natDecoder.transform((natValue) => {
    return jsonValueCreate<number, typeof key>(key)(natValue.unwrap())
  })
