import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"
import { createText100 } from "../../Data/Text"

const key: unique symbol = Symbol()
export type SKU = Opaque<string, typeof key>
export type ErrorSKU = "INVALID_SKU"

export function createSKU(s: string): Maybe<SKU> {
  return toMaybe(createSKUE(s))
}

export function createSKUE(s: string): Result<ErrorSKU, SKU> {
  const trimmed = s.trim()
  if (trimmed === "") return err("INVALID_SKU")

  if (/\s/.test(trimmed)) return err("INVALID_SKU")

  const text100 = createText100(trimmed)
  if (text100 == null) return err("INVALID_SKU")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const skuDecoder: JD.Decoder<SKU> = JD.string.transform((s) => {
  return throwIfNull(createSKU(s), `Invalid SKU: ${s}`)
})
