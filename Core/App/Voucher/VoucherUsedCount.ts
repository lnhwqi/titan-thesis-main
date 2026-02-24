import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type UsedCount = Opaque<number, typeof key>
export type ErrorUsedCount = "INVALID_USED_COUNT"

export function createUsedCount(s: number): Maybe<UsedCount> {
  return toMaybe(createUsedCountE(s))
}

export function createUsedCountE(s: number): Result<ErrorUsedCount, UsedCount> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorUsedCount, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_USED_COUNT")

  return ok(natValue.unwrap())
}

export const usedCountDecoder: JD.Decoder<UsedCount> = natDecoder.transform(
  (natValue) => jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
)
