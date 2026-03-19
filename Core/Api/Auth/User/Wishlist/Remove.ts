import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
} from "../../../../Data/Api"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"

export type Contract = AuthApi<
  AuthUser,
  "DELETE",
  "/user/wishlist/:productID",
  UrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export type UrlParams = {
  productID: ProductID
}

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  productID: ProductID
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  productID: productIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productID: productIDDecoder,
})

export const contract: Contract = {
  method: "DELETE",
  route: "/user/wishlist/:productID",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
