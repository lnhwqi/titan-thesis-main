import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type Verify = Opaque<boolean, typeof key>
export type ErrorVerify = "INVALID_VERIFY"

export function createVerify(s: boolean): Maybe<Verify> {
  return toMaybe(createVerifyE(s))
}

export function createVerifyE(s: boolean): Result<ErrorVerify, Verify> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: boolean): Result<ErrorVerify, boolean> {
  if (typeof s !== "boolean") return err("INVALID_VERIFY")
  return ok(s)
}

export const verifyDecoder: JD.Decoder<Verify> = JD.boolean.transform(
  (boolValue) => jsonValueCreate<boolean, typeof key>(key)(boolValue),
)
