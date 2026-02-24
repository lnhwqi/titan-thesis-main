import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type UsageLimit = Opaque<number, typeof key>
export type ErrorUsageLimit = "INVALID_USAGE_LIMIT"

export function createUsageLimit(s: number): Maybe<UsageLimit> {
  return toMaybe(createUsageLimitE(s))
}

export function createUsageLimitE(
  s: number,
): Result<ErrorUsageLimit, UsageLimit> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorUsageLimit, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_USAGE_LIMIT")

  return ok(natValue.unwrap())
}

export const usageLimitDecoder: JD.Decoder<UsageLimit> = natDecoder.transform(
  (natValue) => jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
)
