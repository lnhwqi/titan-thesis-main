import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../Data/Api"

import { ProductID, productIDDecoder } from "../../../App/Product/ProductID"

export { NoBodyParams, noBodyParamsDecoder }

export type Contract = AuthApi<
  AuthSeller,
  "DELETE",
  "/seller/product/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: ProductID
}

export type ErrorCode = "PRODUCT_NOT_FOUND" | "FORBIDDEN_ACTION"

export type Payload = {
  id: ProductID
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: productIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  id: productIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
  "FORBIDDEN_ACTION",
])

export const contract: Contract = {
  method: "DELETE",
  route: "/seller/product/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
