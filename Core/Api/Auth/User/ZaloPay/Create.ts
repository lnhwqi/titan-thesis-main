import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { Panel, panelDecoder } from "../OrderPayment/Create"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/zalopay/create",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  panels: Panel[]
}

export type ErrorCode = "INVALID_AMOUNT" | "CREATE_FAILED"

export type Payload = {
  appTransID: string
  orderURL: string
  qrCode: string
  zpTransToken: string
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  panels: JD.array(panelDecoder),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  appTransID: JD.string,
  orderURL: JD.string,
  qrCode: JD.string,
  zpTransToken: JD.string,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_AMOUNT",
  "CREATE_FAILED",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/zalopay/create",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
