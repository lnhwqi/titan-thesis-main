import * as JD from "decoders"
import { createText100, text100Decoder } from "../../Data/Text"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"

const key: unique symbol = Symbol()
export type DistrictName = Opaque<string, typeof key>
export type ErrorDistrictName = "INVALID_DISTRICT_NAME"

export function createDistrictName(s: string): Maybe<DistrictName> {
  return toMaybe(createDistrictNameE(s))
}

export function createDistrictNameE(
  s: string,
): Result<ErrorDistrictName, DistrictName> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_DISTRICT_NAME")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const districtNameDecoder: JD.Decoder<DistrictName> =
  text100Decoder.transform((text100) => {
    return jsonValueCreate<string, typeof key>(key)(text100.unwrap())
  })
