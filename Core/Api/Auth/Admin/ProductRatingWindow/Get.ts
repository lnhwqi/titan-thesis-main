import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../../Data/Api"
import { Nat, natDecoder } from "../../../../../Data/Number/Nat"

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/product-rating-window",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  productRatingWindowHours: Nat
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productRatingWindowHours: natDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/admin/product-rating-window",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
