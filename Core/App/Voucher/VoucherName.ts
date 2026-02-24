import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText100, text100Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type VoucherName = Opaque<string, typeof key>
export type ErrorVoucherName = "INVALID_VOUCHER_NAME"

export function createVoucherName(s: string): Maybe<VoucherName> {
  return toMaybe(createVoucherNameE(s))
}

export function createVoucherNameE(
  s: string,
): Result<ErrorVoucherName, VoucherName> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorVoucherName, string> {
  const text100 = createText100(s)

  if (text100 == null) return err("INVALID_VOUCHER_NAME")

  return ok(text100.unwrap())
}

export const voucherNameDecoder: JD.Decoder<VoucherName> =
  text100Decoder.transform((text100) =>
    jsonValueCreate<string, typeof key>(key)(text100.unwrap()),
  )
