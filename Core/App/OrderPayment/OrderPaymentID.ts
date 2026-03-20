import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type OrderPaymentID = Opaque<string, typeof key>
export type ErrorOrderPaymentID = "INVALID_ORDER_PAYMENT_ID"

export function createOrderPaymentID(): OrderPaymentID {
  return _create(createUUID())
}

export const orderPaymentIDDecoder: JD.Decoder<OrderPaymentID> = uuidDecoder
  .describe("INVALID_ORDER_PAYMENT_ID")
  .transform(_create)

function _create(uuid: UUID): OrderPaymentID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}

export function parseOrderPaymentID(str: string): OrderPaymentID {
  return orderPaymentIDDecoder.verify(str)
}
