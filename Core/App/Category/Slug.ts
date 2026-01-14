import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"
import { createText100 } from "../../Data/Text"

const key: unique symbol = Symbol()
export type Slug = Opaque<string, typeof key>

export type ErrorSlug = "INVALID_SLUG"

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function createSlug(s: string): Maybe<Slug> {
  return toMaybe(createSlugE(s))
}

export function createSlugE(s: string): Result<ErrorSlug, Slug> {
  const text100 = createText100(s)

  if (text100 == null) return err("INVALID_SLUG")

  const rawValue = text100.unwrap()

  if (!SLUG_REGEX.test(rawValue)) {
    return err("INVALID_SLUG")
  }

  return ok(jsonValueCreate<string, typeof key>(key)(rawValue))
}

export const slugDecoder: JD.Decoder<Slug> = JD.string.transform((s) => {
  return throwIfNull(createSlug(s), `Invalid slug: ${s}`)
})

export function slugify(text: string): Maybe<Slug> {
  const rawSlug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")

  return createSlug(rawSlug)
}
