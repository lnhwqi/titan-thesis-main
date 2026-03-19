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
  "DELETE",
  "/user/cart/item",
  NoUrlParams,
  BodyParams,
  null,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  productID: ProductID
  variantID: ProductVariantID
}

export type Payload = {
  productID: ProductID
  variantID: ProductVariantID
  deleted: boolean
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  productID: productIDDecoder,
  variantID: productVariantIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  productID: productIDDecoder,
  variantID: productVariantIDDecoder,
  deleted: JD.boolean,
})

export const contract: Contract = {
  method: "DELETE",
  route: "/user/cart/item",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(JD.null_, payloadDecoder),
}
