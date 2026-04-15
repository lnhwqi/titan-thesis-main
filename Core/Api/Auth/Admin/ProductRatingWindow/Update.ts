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
  "/admin/product-rating-window",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  productRatingWindowHours: Nat
}

export type ErrorCode = "INVALID_PRODUCT_RATING_WINDOW"

export type Payload = {
  productRatingWindowHours: Nat
}

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_PRODUCT_RATING_WINDOW",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  productRatingWindowHours: natDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productRatingWindowHours: natDecoder,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/product-rating-window",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
