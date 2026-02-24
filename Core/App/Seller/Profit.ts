import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type Profit = Opaque<number, typeof key>
export type ErrorProfit = "INVALID_PROFIT"

export function createProfit(s: number): Maybe<Profit> {
  return toMaybe(createProfitE(s))
}

export function createProfitE(s: number): Result<ErrorProfit, Profit> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorProfit, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_PROFIT")

  return ok(natValue.unwrap())
}

export const profitDecoder: JD.Decoder<Profit> = natDecoder.transform(
  (natValue) => {
    return jsonValueCreate<number, typeof key>(key)(natValue.unwrap())
  },
)
