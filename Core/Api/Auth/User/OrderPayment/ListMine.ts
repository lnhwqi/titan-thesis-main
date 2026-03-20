import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import {
  NoUrlParams,
  noUrlParamsDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../../Data/Api"
import { OrderPayment, orderPaymentDecoder } from "../../../../App/OrderPayment"

export type { NoUrlParams, NoBodyParams }
export { noUrlParamsDecoder, noBodyParamsDecoder }

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/user/order-payments/mine",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "INVALID_REQUEST"

export type Payload = {
  orders: OrderPayment[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orders: JD.array(orderPaymentDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_REQUEST",
])

export const contract: Contract = {
  method: "GET",
  route: "/user/order-payments/mine",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
