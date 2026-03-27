import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type PosterImageUrl = Opaque<string, typeof key>
export type ErrorPosterImageUrl = "INVALID_POSTER_IMAGE_URL"

export function createPosterImageUrl(s: string): Maybe<PosterImageUrl> {
  return toMaybe(createPosterImageUrlE(s))
}

export function createPosterImageUrlE(
  url: string,
): Result<ErrorPosterImageUrl, PosterImageUrl> {
  if (url.length === 0) {
    return err("INVALID_POSTER_IMAGE_URL")
  }

  return ok(jsonValueCreate<string, typeof key>(key)(url))
}

export const posterImageUrlDecoder: JD.Decoder<PosterImageUrl> =
  JD.string.transform((s) => {
    return throwIfNull(
      createPosterImageUrl(s),
      `Invalid Poster Image URL: ${s}`,
    )
  })
