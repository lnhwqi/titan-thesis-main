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
import { Nat, natDecoder } from "../../../../Data/Number/Nat"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/product-rating-report-limit",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  ratingReportMaxPerDay: Nat
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  ratingReportMaxPerDay: natDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/product-rating-report-limit",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
