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
  "/admin/product-rating-report-limit",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  ratingReportMaxPerDay: Nat
}

export type ErrorCode = "INVALID_RATING_REPORT_LIMIT"

export type Payload = {
  ratingReportMaxPerDay: Nat
}

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_RATING_REPORT_LIMIT",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  ratingReportMaxPerDay: natDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  ratingReportMaxPerDay: natDecoder,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/product-rating-report-limit",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
