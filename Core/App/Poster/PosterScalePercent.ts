import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, err, mapOk, ok, toMaybe } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type PosterScalePercent = Opaque<number, typeof key>
export type ErrorPosterScalePercent = "INVALID_POSTER_SCALE_PERCENT"

export function createPosterScalePercent(v: number): Maybe<PosterScalePercent> {
  return toMaybe(createPosterScalePercentE(v))
}

export function createPosterScalePercentE(
  v: number,
): Result<ErrorPosterScalePercent, PosterScalePercent> {
  return mapOk(_validate(v), jsonValueCreate(key))
}

function _validate(v: number): Result<ErrorPosterScalePercent, number> {
  if (Number.isInteger(v) === false) return err("INVALID_POSTER_SCALE_PERCENT")
  if (v < 10 || v > 300) return err("INVALID_POSTER_SCALE_PERCENT")
  return ok(v)
}

export const posterScalePercentDecoder: JD.Decoder<PosterScalePercent> =
  JD.number.transform((v) => {
    const maybe = createPosterScalePercent(v)
    if (maybe == null) {
      throw new Error(`Invalid PosterScalePercent: ${v}`)
    }
    return maybe
  })
