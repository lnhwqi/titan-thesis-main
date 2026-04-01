import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type SellerUrlImg = Opaque<string, typeof key>
export type ErrorSellerUrlImg = "INVALID_URL"

export function createSellerUrlImg(s: string): Maybe<SellerUrlImg> {
  return toMaybe(createSellerUrlImgE(s))
}

export function createSellerUrlImgE(
  url: string,
): Result<ErrorSellerUrlImg, SellerUrlImg> {
  if (url.length === 0) {
    return err("INVALID_URL")
  }

  return ok(jsonValueCreate<string, typeof key>(key)(url))
}

export const sellerUrlImgDecoder: JD.Decoder<SellerUrlImg> =
  JD.string.transform((s) => {
    return throwIfNull(createSellerUrlImg(s), `Invalid Seller URL: ${s}`)
  })

export type SellerUrlImgs = SellerUrlImg[]

export function createSellerUrlImgs(values: string[]): Maybe<SellerUrlImgs> {
  const created: SellerUrlImgs = []

  for (const value of values) {
    const img = createSellerUrlImg(value)
    if (img == null) {
      return null
    }
    created.push(img)
  }

  return created
}

export const sellerUrlImgsDecoder: JD.Decoder<SellerUrlImgs> =
  JD.array(sellerUrlImgDecoder)
