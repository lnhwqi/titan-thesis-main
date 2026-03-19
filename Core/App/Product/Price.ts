import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
const MAX_INT_32 = 2147483647
export type Price = Opaque<number, typeof key>
export type ErrorPrice = "INVALID_PRICE"

export function createPrice(s: number): Maybe<Price> {
  return toMaybe(createPriceE(s))
}

export function createPriceE(s: number): Result<ErrorPrice, Price> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorPrice, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_PRICE")

  if (natValue.unwrap() > MAX_INT_32) return err("INVALID_PRICE")

  return ok(natValue.unwrap())
}

export const priceDecoder: JD.Decoder<Price> = natDecoder.transform(
  (natValue) => {
    if (natValue.unwrap() > MAX_INT_32) {
      throw new Error("INVALID_PRICE")
    }

    return jsonValueCreate<number, typeof key>(key)(natValue.unwrap())
  },
)
