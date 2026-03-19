import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  NoErrorCode,
  noBodyParamsDecoder,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../Data/Api"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/user/wishlist",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  productIDs: ProductID[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productIDs: JD.array(productIDDecoder),
})

export const contract: Contract = {
  method: "GET",
  route: "/user/wishlist",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
