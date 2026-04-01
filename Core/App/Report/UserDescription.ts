import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText1024, text1024Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type UserDescription = Opaque<string, typeof key>
export type ErrorUserDescription = "INVALID_USER_DESCRIPTION"

export function createUserDescription(s: string): Maybe<UserDescription> {
  return toMaybe(createUserDescriptionE(s))
}

export function createUserDescriptionE(
  s: string,
): Result<ErrorUserDescription, UserDescription> {
  const text = createText1024(s)
  if (text == null) return err("INVALID_USER_DESCRIPTION")

  return ok(jsonValueCreate<string, typeof key>(key)(text.unwrap()))
}

export const userDescriptionDecoder: JD.Decoder<UserDescription> =
  text1024Decoder.transform((text) => {
    return jsonValueCreate<string, typeof key>(key)(text.unwrap())
  })
