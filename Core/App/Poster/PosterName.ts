import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText120, text120Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type PosterName = Opaque<string, typeof key>
export type ErrorPosterName = "INVALID_POSTER_NAME"

export function createPosterName(s: string): Maybe<PosterName> {
  return toMaybe(createPosterNameE(s))
}

export function createPosterNameE(
  s: string,
): Result<ErrorPosterName, PosterName> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorPosterName, string> {
  const text120 = createText120(s)
  if (text120 == null) return err("INVALID_POSTER_NAME")
  return ok(text120.unwrap())
}

export const posterNameDecoder: JD.Decoder<PosterName> =
  text120Decoder.transform((text120) =>
    jsonValueCreate<string, typeof key>(key)(text120.unwrap()),
  )
