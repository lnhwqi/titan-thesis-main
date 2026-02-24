import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type Points = Opaque<number, typeof key>
export type ErrorPoints = "INVALID_POINTS"

export function createPoints(s: number): Maybe<Points> {
  return toMaybe(createPointsE(s))
}

export function createPointsE(s: number): Result<ErrorPoints, Points> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: number): Result<ErrorPoints, number> {
  const natValue = createNat(s)

  if (natValue == null) return err("INVALID_POINTS")

  return ok(natValue.unwrap())
}

export const pointsDecoder: JD.Decoder<Points> = natDecoder.transform(
  (natValue) => jsonValueCreate<number, typeof key>(key)(natValue.unwrap()),
)
