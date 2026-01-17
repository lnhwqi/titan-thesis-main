import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type ExpiryDate = Opaque<string, typeof key>
export type ErrorExpiryDate = "INVALID_EXPIRY_DATE"

export function createExpiryDate(s: string): Maybe<ExpiryDate> {
  return toMaybe(createExpiryDateE(s))
}

export function createExpiryDateE(
  s: string,
): Result<ErrorExpiryDate, ExpiryDate> {
  const isIso = !isNaN(Date.parse(s))
  if (!isIso) return err("INVALID_EXPIRY_DATE")
  return ok(jsonValueCreate<string, typeof key>(key)(s))
}

export const expiryDateDecoder: JD.Decoder<ExpiryDate> = JD.string.transform(
  (s) => {
    return throwIfNull(createExpiryDate(s), `Invalid ExpiryDate: ${s}`)
  },
)
