import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, err, mapOk, ok, toMaybe } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type PosterOffsetPercent = Opaque<number, typeof key>
export type ErrorPosterOffsetPercent = "INVALID_POSTER_OFFSET_PERCENT"

export function createPosterOffsetPercent(
  v: number,
): Maybe<PosterOffsetPercent> {
  return toMaybe(createPosterOffsetPercentE(v))
}

export function createPosterOffsetPercentE(
  v: number,
): Result<ErrorPosterOffsetPercent, PosterOffsetPercent> {
  return mapOk(_validate(v), jsonValueCreate(key))
}

function _validate(v: number): Result<ErrorPosterOffsetPercent, number> {
  if (Number.isInteger(v) === false) return err("INVALID_POSTER_OFFSET_PERCENT")
  if (v < -100 || v > 100) return err("INVALID_POSTER_OFFSET_PERCENT")
  return ok(v)
}

export const posterOffsetPercentDecoder: JD.Decoder<PosterOffsetPercent> =
  JD.number.transform((v) => {
    const maybe = createPosterOffsetPercent(v)
    if (maybe == null) {
      throw new Error(`Invalid PosterOffsetPercent: ${v}`)
    }
    return maybe
  })
