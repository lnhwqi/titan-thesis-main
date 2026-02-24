import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText20, text20Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type VoucherCode = Opaque<string, typeof key>
export type ErrorVoucherCode = "INVALID_VOUCHER_CODE"

export function createVoucherCode(s: string): Maybe<VoucherCode> {
  return toMaybe(createVoucherCodeE(s))
}

export function createVoucherCodeE(
  s: string,
): Result<ErrorVoucherCode, VoucherCode> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorVoucherCode, string> {
  const text20 = createText20(s)

  if (text20 == null) return err("INVALID_VOUCHER_CODE")

  const code = text20.unwrap()
  const isValidFormat = /^[A-Z0-9]+$/.test(code)

  if (!isValidFormat) return err("INVALID_VOUCHER_CODE")

  return ok(code)
}

export const voucherCodeDecoder: JD.Decoder<VoucherCode> =
  text20Decoder.transform((text20) => {
    const code = text20.unwrap()
    if (!/^[A-Z0-9]+$/.test(code)) {
      throw new Error(`Invalid voucher code: ${code}`)
    }
    return jsonValueCreate<string, typeof key>(key)(code)
  })
