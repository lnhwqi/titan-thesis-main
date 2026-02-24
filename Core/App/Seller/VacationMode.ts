import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type VacationMode = Opaque<boolean, typeof key>
export type ErrorVacationMode = "INVALID_VACATION_MODE"

export function createVacationMode(s: boolean): Maybe<VacationMode> {
  return toMaybe(createVacationModeE(s))
}

export function createVacationModeE(
  s: boolean,
): Result<ErrorVacationMode, VacationMode> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: boolean): Result<ErrorVacationMode, boolean> {
  if (typeof s !== "boolean") return err("INVALID_VACATION_MODE")
  return ok(s)
}

export const vacationModeDecoder: JD.Decoder<VacationMode> =
  JD.boolean.transform((boolValue) =>
    jsonValueCreate<boolean, typeof key>(key)(boolValue),
  )
