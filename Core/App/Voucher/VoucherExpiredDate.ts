import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type ExpiredDate = Opaque<number, typeof key>
export type ErrorExpiredDate = "INVALID_EXPIRED_DATE"

export function createExpiredDate(s: number): Maybe<ExpiredDate> {
  return toMaybe(createExpiredDateE(s))
}

export function createExpiredDateE(
  s: number,
): Result<ErrorExpiredDate, ExpiredDate> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorExpiredDate, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_EXPIRED_DATE")

  return ok(natValue.unwrap())
}

export const expiredDateDecoder: JD.Decoder<ExpiredDate> = natDecoder.transform(
  (natValue) => jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
)
