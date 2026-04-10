import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const wardKey: unique symbol = Symbol()
export type WardCode = Opaque<string, typeof wardKey>
export type ErrorWardCode = "EMPTY_WARD_CODE"

export function createWardCode(s: string): Maybe<WardCode> {
  return toMaybe(createWardCodeE(s))
}

export function createWardCodeE(s: string): Result<ErrorWardCode, WardCode> {
  const validated = validateFormat(s)

  if (validated._t === "Err") return validated

  return ok(unsafeFromString(validated.value))
}

export const wardCodeDecoder: JD.Decoder<WardCode> = JD.either(
  JD.number,
  JD.string,
).transform((val) => {
  const strVal = String(val)
  const validated = validateFormat(strVal)

  if (validated._t === "Err") {
    throw new Error(validated.error)
  }

  return unsafeFromString(validated.value)
})

function validateFormat(s: string): Result<ErrorWardCode, string> {
  const trimmed = s.trim()

  if (!trimmed) {
    return err("EMPTY_WARD_CODE")
  }

  return ok(trimmed)
}

function unsafeFromString(s: string): WardCode {
  return jsonValueCreate<string, typeof wardKey>(wardKey)(s)
}
