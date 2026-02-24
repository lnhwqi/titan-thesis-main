import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type TierLevel = "bronze" | "silver" | "gold" | "diamond"
export type Tier = Opaque<TierLevel, typeof key>
export type ErrorTier = "INVALID_TIER"

export function createTier(s: string): Maybe<Tier> {
  return toMaybe(createTierE(s))
}

export function createTierE(s: string): Result<ErrorTier, Tier> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorTier, TierLevel> {
  switch (s) {
    case "bronze":
    case "silver":
    case "gold":
    case "diamond":
      return ok(s)
    default:
      return err("INVALID_TIER")
  }
}

export const tierDecoder: JD.Decoder<Tier> = JD.string.transform((s) => {
  return throwIfNull(createTier(s), `Invalid tier: ${s}`)
})
