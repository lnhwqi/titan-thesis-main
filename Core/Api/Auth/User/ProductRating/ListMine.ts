import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import {
  NoUrlParams,
  noUrlParamsDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../../Data/Api"
import {
  ProductRating,
  productRatingDecoder,
} from "../../../../App/ProductRating"

export type { NoUrlParams, NoBodyParams }

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/user/product-ratings/mine",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "INVALID_REQUEST"

export type Payload = {
  ratings: ProductRating[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  ratings: JD.array(productRatingDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_REQUEST",
])

export const contract: Contract = {
  method: "GET",
  route: "/user/product-ratings/mine",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
