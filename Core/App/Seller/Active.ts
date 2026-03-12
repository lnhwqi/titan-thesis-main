import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok, mapOk } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type Active = Opaque<boolean, typeof key>
export type ErrorActive = "INVALID_ACTIVE"

export function createActive(b: boolean): Maybe<Active> {
  return toMaybe(createActiveE(b))
}

export function createActiveE(b: boolean): Result<ErrorActive, Active> {
  return mapOk(_validate(b), jsonValueCreate(key))
}

export const activeDecoder: JD.Decoder<Active> = JD.boolean.transform((b) => {
  return jsonValueCreate<boolean, typeof key>(key)(b)
})

function _validate(b: boolean): Result<ErrorActive, boolean> {
  if (typeof b !== "boolean") return err("INVALID_ACTIVE")
  return ok(b)
}
