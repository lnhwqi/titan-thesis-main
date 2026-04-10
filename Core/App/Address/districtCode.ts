import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const districtKey: unique symbol = Symbol()
export type DistrictCode = Opaque<string, typeof districtKey>
export type ErrorDistrictCode = "INVALID_DISTRICT_CODE" | "EMPTY_DISTRICT_CODE"

export function createDistrictCode(s: string): Maybe<DistrictCode> {
  return toMaybe(createDistrictCodeE(s))
}

export function createDistrictCodeE(
  s: string,
): Result<ErrorDistrictCode, DistrictCode> {
  const validated = validateFormat(s)

  if (validated._t === "Err") return validated

  return ok(unsafeFromString(validated.value))
}

// Accepts both Number (from GHN API) and String, safely casting to String
export const districtCodeDecoder: JD.Decoder<DistrictCode> = JD.either(
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

function validateFormat(s: string): Result<ErrorDistrictCode, string> {
  const trimmed = s.trim()

  if (!trimmed) {
    return err("EMPTY_DISTRICT_CODE")
  }

  // Relaxed Regex for GHN compatibility:
  // GHN uses internal integer IDs (e.g., 1442, 3695), not the standard 3-digit GSO code.
  // This ensures the string contains only numbers of any length.
  if (!/^\d+$/.test(trimmed)) {
    return err("INVALID_DISTRICT_CODE")
  }

  return ok(trimmed)
}

function unsafeFromString(s: string): DistrictCode {
  return jsonValueCreate<string, typeof districtKey>(districtKey)(s)
}
