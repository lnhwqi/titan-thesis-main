import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../Data/Api"
import { Report, reportDecoder } from "../../../../App/Report"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/reports",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams

export type ErrorCode = "INVALID_REQUEST"

export type Payload = {
  reports: Report[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  reports: JD.array(reportDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_REQUEST",
])

export const contract: Contract = {
  method: "GET",
  route: "/admin/reports",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
