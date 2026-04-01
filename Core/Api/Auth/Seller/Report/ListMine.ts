import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../Data/Api"
import { Report, reportDecoder } from "../../../../App/Report"

export type Contract = AuthApi<
  AuthSeller,
  "GET",
  "/seller/reports/mine",
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
  route: "/seller/reports/mine",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
