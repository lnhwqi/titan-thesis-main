import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

import { createNatE } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type Stock = Opaque<number, typeof key>

export type ErrorStock = "INVALID_STOCK"

export function createStock(n: number): Maybe<Stock> {
  return toMaybe(createStockE(n))
}

export function createStockE(n: number): Result<ErrorStock, Stock> {
  const natResult = createNatE(n)

  if (natResult._t === "Err") {
    return err("INVALID_STOCK")
  }
  return ok(jsonValueCreate<number, typeof key>(key)(n))
}

export const stockDecoder: JD.Decoder<Stock> = JD.number.transform((n) => {
  return throwIfNull(createStock(n), `Invalid stock: ${n}`)
})
