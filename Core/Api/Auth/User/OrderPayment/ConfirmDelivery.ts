import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { OrderPayment, orderPaymentDecoder } from "../../../../App/OrderPayment"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../../App/OrderPayment/OrderPaymentID"

export type DeliveryDecision = "RECEIVED" | "DELIVERY_ISSUE"

export type UrlParams = {
  id: OrderPaymentID
}

export type BodyParams = {
  decision: DeliveryDecision
}

export type Contract = AuthApi<
  AuthUser,
  "PUT",
  "/user/order-payment/:id/delivery-confirmation",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "ORDER_PAYMENT_NOT_FOUND" | "INVALID_STATUS_TRANSITION"

export type Payload = {
  orderPayment: OrderPayment
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orderPayment: orderPaymentDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "ORDER_PAYMENT_NOT_FOUND",
  "INVALID_STATUS_TRANSITION",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: orderPaymentIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  decision: JD.oneOf(["RECEIVED", "DELIVERY_ISSUE"]),
})

export const contract: Contract = {
  method: "PUT",
  route: "/user/order-payment/:id/delivery-confirmation",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
