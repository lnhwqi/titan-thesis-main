import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type Active = Opaque<boolean, typeof key>
export type ErrorActive = "INVALID_ACTIVE"

export function createActive(s: boolean): Maybe<Active> {
  return toMaybe(createActiveE(s))
}

export function createActiveE(s: boolean): Result<ErrorActive, Active> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: boolean): Result<ErrorActive, boolean> {
  if (typeof s !== "boolean") return err("INVALID_ACTIVE")
  return ok(s)
}

export const activeDecoder: JD.Decoder<Active> = JD.boolean.transform(
  (boolValue) => jsonValueCreate<boolean, typeof key>(key)(boolValue),
)
