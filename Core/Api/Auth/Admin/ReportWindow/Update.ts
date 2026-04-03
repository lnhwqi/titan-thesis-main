import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { Nat, natDecoder } from "../../../../Data/Number/Nat"

export type Contract = AuthApi<
  AuthAdmin,
  "PATCH",
  "/admin/report-window",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = {
  reportWindowHours: Nat
}
export type ErrorCode = "INVALID_REPORT_WINDOW"

export type Payload = {
  reportWindowHours: Nat
}

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_REPORT_WINDOW",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  reportWindowHours: natDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  reportWindowHours: natDecoder,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/report-window",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
