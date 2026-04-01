import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../Data/Api"
import { OrderPayment, orderPaymentDecoder } from "../../../../App/OrderPayment"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/order-payments",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode
export type UrlParams = NoUrlParams

export type Payload = {
  orders: OrderPayment[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orders: JD.array(orderPaymentDecoder),
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/order-payments",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
