import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type PosterPermanent = Opaque<boolean, typeof key>
export type ErrorPosterPermanent = "INVALID_POSTER_PERMANENT"

export function createPosterPermanent(v: boolean): Maybe<PosterPermanent> {
  return toMaybe(createPosterPermanentE(v))
}

export function createPosterPermanentE(
  v: boolean,
): Result<ErrorPosterPermanent, PosterPermanent> {
  return mapOk(_validate(v), jsonValueCreate(key))
}

function _validate(v: boolean): Result<ErrorPosterPermanent, boolean> {
  if (typeof v !== "boolean") return err("INVALID_POSTER_PERMANENT")
  return ok(v)
}

export const posterPermanentDecoder: JD.Decoder<PosterPermanent> =
  JD.boolean.transform((v) => jsonValueCreate<boolean, typeof key>(key)(v))
