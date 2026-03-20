import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText100, text100Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type OrderPaymentTrackingCode = Opaque<string, typeof key>
export type ErrorOrderPaymentTrackingCode =
  "INVALID_ORDER_PAYMENT_TRACKING_CODE"

export function createOrderPaymentTrackingCode(
  s: string,
): Maybe<OrderPaymentTrackingCode> {
  return toMaybe(createOrderPaymentTrackingCodeE(s))
}

export function createOrderPaymentTrackingCodeE(
  s: string,
): Result<ErrorOrderPaymentTrackingCode, OrderPaymentTrackingCode> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorOrderPaymentTrackingCode, string> {
  const textValue = createText100(s)
  if (textValue == null) {
    return err("INVALID_ORDER_PAYMENT_TRACKING_CODE")
  }

  return ok(textValue.unwrap())
}

export const orderPaymentTrackingCodeDecoder: JD.Decoder<OrderPaymentTrackingCode> =
  text100Decoder.transform((textValue) =>
    jsonValueCreate<string, typeof key>(key)(textValue.unwrap()),
  )
