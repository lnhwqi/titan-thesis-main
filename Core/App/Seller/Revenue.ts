import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type Revenue = Opaque<number, typeof key>
export type ErrorRevenue = "INVALID_REVENUE"

export function createRevenue(s: number): Maybe<Revenue> {
  return toMaybe(createRevenueE(s))
}

export function createRevenueE(s: number): Result<ErrorRevenue, Revenue> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorRevenue, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_REVENUE")

  return ok(natValue.unwrap())
}

export const revenueDecoder: JD.Decoder<Revenue> = natDecoder.transform(
  (natValue) => jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
)
