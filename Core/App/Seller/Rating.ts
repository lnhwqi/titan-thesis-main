import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"
import { clamp, numberStringDecoder } from "../../Data/Number"

const key: unique symbol = Symbol()
export type Rating = Opaque<number, typeof key>
export type ErrorRating = "INVALID_RATING"

export function createRating(s: number): Maybe<Rating> {
  return toMaybe(createRatingE(s))
}

export function createRatingE(s: number): Result<ErrorRating, Rating> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorRating, number> {
  if (typeof s !== "number" || isNaN(s)) return err("INVALID_RATING")
  return ok(clamp(1, 5, s))
}

export const ratingDecoder: JD.Decoder<Rating> = JD.number.transform((s) => {
  return throwIfNull(createRating(s), `Invalid rating: ${s}`)
})

export const ratingStringDecoder: JD.Decoder<Rating> =
  numberStringDecoder.transform((s) => {
    return throwIfNull(createRating(s), `Invalid rating string: ${s}`)
  })
