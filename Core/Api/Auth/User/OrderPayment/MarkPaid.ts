import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { Panel, panelDecoder } from "./Create"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/order-payment/mark-paid",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  orderPaymentIDs: string[]
  panels: Panel[]
}

export type ErrorCode = "INVALID_ORDER_IDS"

export type Payload = {
  updatedCount: number
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  orderPaymentIDs: JD.array(JD.string),
  panels: JD.array(panelDecoder),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  updatedCount: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_ORDER_IDS",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/order-payment/mark-paid",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
