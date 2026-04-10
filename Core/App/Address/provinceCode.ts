import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const provinceKey: unique symbol = Symbol()
export type ProvinceCode = Opaque<string, typeof provinceKey>
export type ErrorProvinceCode = "INVALID_PROVINCE_CODE" | "EMPTY_PROVINCE_CODE"

export function createProvinceCode(s: string): Maybe<ProvinceCode> {
  return toMaybe(createProvinceCodeE(s))
}

export function createProvinceCodeE(
  s: string,
): Result<ErrorProvinceCode, ProvinceCode> {
  const validated = validateFormat(s)

  if (validated._t === "Err") return validated

  return ok(unsafeFromString(validated.value))
}

export const provinceCodeDecoder: JD.Decoder<ProvinceCode> = JD.either(
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

function validateFormat(s: string): Result<ErrorProvinceCode, string> {
  const trimmed = s.trim()

  if (!trimmed) {
    return err("EMPTY_PROVINCE_CODE")
  }

  if (!/^\d+$/.test(trimmed)) {
    return err("INVALID_PROVINCE_CODE")
  }

  return ok(trimmed)
}

function unsafeFromString(s: string): ProvinceCode {
  return jsonValueCreate<string, typeof provinceKey>(provinceKey)(s)
}
