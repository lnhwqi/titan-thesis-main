import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"
import { Product, productDecoder } from "../../../App/ProductDetail"
import { ProductID, productIDDecoder } from "../../../App/Product/ProductID"

export type Contract = Api<
  "GET",
  "/products/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: ProductID
}

export type ErrorCode = "PRODUCT_NOT_FOUND"

export type Payload = Product

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: productIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = productDecoder

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
])

export const contract: Contract = {
  method: "GET",
  route: "/products/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
