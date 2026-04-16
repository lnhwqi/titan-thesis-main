import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { createText100, text100Decoder } from "../../Data/Text"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type ProvinceName = Opaque<string, typeof key>
export type ErrorProvinceName = "INVALID_PROVINCE_NAME"

export function createProvinceName(s: string): Maybe<ProvinceName> {
  return toMaybe(createProvinceNameE(s))
}

export function createProvinceNameE(
  s: string,
): Result<ErrorProvinceName, ProvinceName> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_PROVINCE_NAME")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const provinceNameDecoder: JD.Decoder<ProvinceName> =
  text100Decoder.transform((text100) => {
    return jsonValueCreate<string, typeof key>(key)(text100.unwrap())
  })
