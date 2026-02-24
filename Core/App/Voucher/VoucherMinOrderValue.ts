import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type MinOrderValue = Opaque<number, typeof key>
export type ErrorMinOrderValue = "INVALID_MIN_ORDER_VALUE"

export function createMinOrderValue(s: number): Maybe<MinOrderValue> {
  return toMaybe(createMinOrderValueE(s))
}

export function createMinOrderValueE(
  s: number,
): Result<ErrorMinOrderValue, MinOrderValue> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorMinOrderValue, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_MIN_ORDER_VALUE")

  return ok(natValue.unwrap())
}

export const minOrderValueDecoder: JD.Decoder<MinOrderValue> =
  natDecoder.transform((natValue) =>
    jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
  )
