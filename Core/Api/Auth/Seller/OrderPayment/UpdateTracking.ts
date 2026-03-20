import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../../Data/Api/Auth"
import { OrderPayment, orderPaymentDecoder } from "../../../../App/OrderPayment"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../../App/OrderPayment/OrderPaymentID"
import {
  OrderPaymentStatus,
  orderPaymentStatusDecoder,
} from "../../../../App/OrderPayment/OrderPaymentStatus"
import {
  OrderPaymentTrackingCode,
  orderPaymentTrackingCodeDecoder,
} from "../../../../App/OrderPayment/OrderPaymentTrackingCode"
import { Maybe, maybeOptionalDecoder } from "../../../../Data/Maybe"

export type UrlParams = {
  id: OrderPaymentID
}

export type BodyParams = {
  status: OrderPaymentStatus
  trackingCode: Maybe<OrderPaymentTrackingCode>
}

export type Contract = AuthApi<
  AuthSeller,
  "PUT",
  "/seller/order-payment/:id/tracking",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "ORDER_PAYMENT_NOT_FOUND"

export type Payload = {
  orderPayment: OrderPayment
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orderPayment: orderPaymentDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "ORDER_PAYMENT_NOT_FOUND",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: orderPaymentIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  status: orderPaymentStatusDecoder,
  trackingCode: maybeOptionalDecoder(orderPaymentTrackingCodeDecoder),
})

export const contract: Contract = {
  method: "PUT",
  route: "/seller/order-payment/:id/tracking",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
