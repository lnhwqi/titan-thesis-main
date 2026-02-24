import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type Withdrawn = Opaque<number, typeof key>
export type ErrorWithdrawn = "INVALID_WITHDRAWN"

export function createWithdrawn(s: number): Maybe<Withdrawn> {
  return toMaybe(createWithdrawnE(s))
}

export function createWithdrawnE(s: number): Result<ErrorWithdrawn, Withdrawn> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorWithdrawn, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_WITHDRAWN")

  return ok(natValue.unwrap())
}

export const withdrawnDecoder: JD.Decoder<Withdrawn> = natDecoder.transform(
  (natValue) => jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
)
