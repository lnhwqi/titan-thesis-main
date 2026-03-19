import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/wishlist",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = {
  productID: ProductID
}

export type ErrorCode = "PRODUCT_NOT_FOUND"

export type Payload = {
  productID: ProductID
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  productID: productIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productID: productIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/wishlist",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
