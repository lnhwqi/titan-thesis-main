import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type ImageUrl = Opaque<string, typeof key>
export type ErrorImageUrl = "INVALID_URL"

export function createImageUrl(s: string): Maybe<ImageUrl> {
  return toMaybe(createImageUrlE(s))
}

export function createImageUrlE(url: string): Result<ErrorImageUrl, ImageUrl> {
  if (url.length === 0) {
    return err("INVALID_URL")
  }

  return ok(jsonValueCreate<string, typeof key>(key)(url))
}

export const imageUrlDecoder: JD.Decoder<ImageUrl> = JD.string.transform(
  (s) => {
    return throwIfNull(createImageUrl(s), `Invalid Image URL: ${s}`)
  },
)
