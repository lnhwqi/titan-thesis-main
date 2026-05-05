import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../../Data/Api"
import { OrderPayment, orderPaymentDecoder } from "../../../../App/OrderPayment"

export type UrlParams = {
  page: number
  limit: number
}

export type { NoBodyParams }
export { noBodyParamsDecoder }

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/user/order-payments/mine?page=:page&limit=:limit",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "INVALID_REQUEST"

export type Payload = {
  orders: OrderPayment[]
  totalCount: number
  totalMoneyPaid: number
  totalProducts: number
  page: number
  limit: number
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  page: JD.optional(JD.either(JD.string, JD.number)),
  limit: JD.optional(JD.either(JD.string, JD.number)),
}).transform((obj) => {
  const pageParsed = obj.page ? Number(obj.page) : 1
  const limitParsed = obj.limit ? Number(obj.limit) : 5

  return {
    page: Number.isNaN(pageParsed) ? 1 : pageParsed,
    limit: Number.isNaN(limitParsed) ? 5 : limitParsed,
  }
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orders: JD.array(orderPaymentDecoder),
  totalCount: JD.number,
  totalMoneyPaid: JD.number,
  totalProducts: JD.number,
  page: JD.number,
  limit: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_REQUEST",
])

export const contract: Contract = {
  method: "GET",
  route: "/user/order-payments/mine?page=:page&limit=:limit",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
