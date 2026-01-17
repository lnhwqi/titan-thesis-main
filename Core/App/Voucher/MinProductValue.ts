import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type MinProductValue = Opaque<number, typeof key>
export type ErrorMinProductValue = "INVALID_MIN_Product_VALUE"

export function createMinProductValue(n: number): Maybe<MinProductValue> {
  return toMaybe(createMinProductValueE(n))
}

export function createMinProductValueE(
  n: number,
): Result<ErrorMinProductValue, MinProductValue> {
  if (n < 0) return err("INVALID_MIN_Product_VALUE")
  return ok(jsonValueCreate<number, typeof key>(key)(n))
}

export const minProductValueDecoder: JD.Decoder<MinProductValue> =
  JD.number.transform((n) => {
    return throwIfNull(
      createMinProductValue(n),
      `Invalid Min Product Value: ${n}`,
    )
  })
