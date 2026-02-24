import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { percentDecoder } from "../../Data/Number/Percent"

const key: unique symbol = Symbol()
export type Tax = Opaque<number, typeof key>
export type ErrorTax = "INVALID_TAX"

export function createTax(s: number): Maybe<Tax> {
  return toMaybe(createTaxE(s))
}

export function createTaxE(s: number): Result<ErrorTax, Tax> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorTax, number> {
  try {
    const percentValue = percentDecoder.verify(s)
    return ok(percentValue.unwrap())
  } catch {
    return err("INVALID_TAX")
  }
}

export const taxDecoder: JD.Decoder<Tax> = percentDecoder.transform((percent) =>
  jsonValueCreate<number, typeof key>(key)(percent.unwrap()),
)
