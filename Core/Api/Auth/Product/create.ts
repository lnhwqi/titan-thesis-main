import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

import { DetailProduct, productDecoder } from "../../../App/ProductDetail"
import { Name, nameDecoder } from "../../../App/Product/Name"
import { Price, priceDecoder } from "../../../App/Product/Price"
import {
  Description,
  descriptionDecoder,
} from "../../../App/Product/Description"
import { ImageUrl, imageUrlDecoder } from "../../../App/Product/ProductImageUrl"
import { CategoryID, categoryIDDecoder } from "../../../App/Category/CategoryID"
import {
  ProductAttributes,
  productAttributesDecoder,
} from "../../../App/Product/Attributes"

import { SKU, skuDecoder } from "../../../App/ProductVariant/ProductVarirantSKU"
import { Stock, stockDecoder } from "../../../App/ProductVariant/Stock"

export type { NoUrlParams }
export { noUrlParamsDecoder }
export type Contract = AuthApi<
  AuthSeller,
  "POST",
  "/seller/product",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type CreateVariantBody = {
  name: Name
  sku: SKU
  price: Price
  stock: Stock
}

export type BodyParams = {
  name: Name
  price: Price
  description: Description
  urls: ImageUrl[]
  categoryID: CategoryID
  attributes: ProductAttributes
  variants: CreateVariantBody[]
}

export type ErrorCode =
  | "SELLER_NOT_APPROVED"
  | "CATEGORY_NOT_FOUND"
  | "SKU_ALREADY_EXISTS"
  | "INVALID_PRODUCT_INPUT"

export type Payload = {
  product: DetailProduct
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  product: productDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SELLER_NOT_APPROVED",
  "CATEGORY_NOT_FOUND",
  "SKU_ALREADY_EXISTS",
  "INVALID_PRODUCT_INPUT",
])

export const createVariantBodyDecoder: JD.Decoder<CreateVariantBody> =
  JD.object({
    name: nameDecoder,
    sku: skuDecoder,
    price: priceDecoder,
    stock: stockDecoder,
  })

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: nameDecoder,
  price: priceDecoder,
  description: descriptionDecoder,
  urls: JD.array(imageUrlDecoder),
  categoryID: categoryIDDecoder,
  attributes: productAttributesDecoder,
  variants: JD.array(createVariantBodyDecoder),
})

export const contract: Contract = {
  method: "POST",
  route: "/seller/product",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
