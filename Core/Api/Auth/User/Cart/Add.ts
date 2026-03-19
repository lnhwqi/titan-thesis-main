import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "../../../../App/ProductVariant/ProductVariantID"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/cart/add",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  productID: ProductID
  variantID: ProductVariantID
}

export type ErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "VARIANT_NOT_FOUND"
  | "VARIANT_NOT_IN_PRODUCT"
  | "OUT_OF_STOCK"

export type Payload = {
  productID: ProductID
  variantID: ProductVariantID
  quantity: number
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  productID: productIDDecoder,
  variantID: productVariantIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productID: productIDDecoder,
  variantID: productVariantIDDecoder,
  quantity: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
  "VARIANT_NOT_FOUND",
  "VARIANT_NOT_IN_PRODUCT",
  "OUT_OF_STOCK",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/cart/add",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
