import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, mapOk, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText256, text256Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type OrderPaymentAddress = Opaque<string, typeof key>
export type ErrorOrderPaymentAddress = "INVALID_ORDER_PAYMENT_ADDRESS"

export function createOrderPaymentAddress(
  s: string,
): Maybe<OrderPaymentAddress> {
  return toMaybe(createOrderPaymentAddressE(s))
}

export function createOrderPaymentAddressE(
  s: string,
): Result<ErrorOrderPaymentAddress, OrderPaymentAddress> {
  return mapOk(_validate(s), jsonValueCreate(key))
}

function _validate(s: string): Result<ErrorOrderPaymentAddress, string> {
  const textValue = createText256(s)
  if (textValue == null) return err("INVALID_ORDER_PAYMENT_ADDRESS")

  return ok(textValue.unwrap())
}

export const orderPaymentAddressDecoder: JD.Decoder<OrderPaymentAddress> =
  text256Decoder.transform((textValue) =>
    jsonValueCreate<string, typeof key>(key)(textValue.unwrap()),
  )
