import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText1024, text1024Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type PosterDescription = Opaque<string, typeof key>
export type ErrorPosterDescription = "INVALID_POSTER_DESCRIPTION"

export function createPosterDescription(s: string): Maybe<PosterDescription> {
  return toMaybe(createPosterDescriptionE(s))
}

export function createPosterDescriptionE(
  s: string,
): Result<ErrorPosterDescription, PosterDescription> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorPosterDescription, string> {
  const text1024 = createText1024(s)
  if (text1024 == null) return err("INVALID_POSTER_DESCRIPTION")
  return ok(text1024.unwrap())
}

export const posterDescriptionDecoder: JD.Decoder<PosterDescription> =
  text1024Decoder.transform((text1024) =>
    jsonValueCreate<string, typeof key>(key)(text1024.unwrap()),
  )
