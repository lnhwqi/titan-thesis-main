import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText100, text100Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type WardName = Opaque<string, typeof key>
export type ErrorWardName = "INVALID_WARD_NAME"

export function createWardName(s: string): Maybe<WardName> {
  return toMaybe(createWardNameE(s))
}

export function createWardNameE(s: string): Result<ErrorWardName, WardName> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_WARD_NAME")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const wardNameDecoder: JD.Decoder<WardName> = text100Decoder.transform(
  (text100) => {
    return jsonValueCreate<string, typeof key>(key)(text100.unwrap())
  },
)
