import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText1024, text1024Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type Description = Opaque<string, typeof key>
export type ErrorDescription = "INVALID_DESCRIPTION"

export function createDescription(s: string): Maybe<Description> {
  return toMaybe(createDescriptionE(s))
}

export function createDescriptionE(
  s: string,
): Result<ErrorDescription, Description> {
  const text100 = createText1024(s)
  if (text100 == null) return err("INVALID_DESCRIPTION")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const descriptionDecoder: JD.Decoder<Description> =
  text1024Decoder.transform((text1024) => {
    return jsonValueCreate<string, typeof key>(key)(text1024.unwrap())
  })
