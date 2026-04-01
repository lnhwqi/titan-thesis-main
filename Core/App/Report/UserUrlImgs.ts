import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type UserUrlImg = Opaque<string, typeof key>
export type ErrorUserUrlImg = "INVALID_URL"

export function createUserUrlImg(s: string): Maybe<UserUrlImg> {
  return toMaybe(createUserUrlImgE(s))
}

export function createUserUrlImgE(
  url: string,
): Result<ErrorUserUrlImg, UserUrlImg> {
  if (url.length === 0) {
    return err("INVALID_URL")
  }

  return ok(jsonValueCreate<string, typeof key>(key)(url))
}

export const userUrlImgDecoder: JD.Decoder<UserUrlImg> = JD.string.transform(
  (s) => {
    return throwIfNull(createUserUrlImg(s), `Invalid User URL: ${s}`)
  },
)

export type UserUrlImgs = UserUrlImg[]

export function createUserUrlImgs(values: string[]): Maybe<UserUrlImgs> {
  const created: UserUrlImgs = []

  for (const value of values) {
    const img = createUserUrlImg(value)
    if (img == null) {
      return null
    }
    created.push(img)
  }

  return created
}

export const userUrlImgsDecoder: JD.Decoder<UserUrlImgs> =
  JD.array(userUrlImgDecoder)
