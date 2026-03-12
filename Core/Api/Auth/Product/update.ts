import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"

import { DetailProduct, productDecoder } from "../../../App/ProductDetail"
import { ProductID, productIDDecoder } from "../../../App/Product/ProductID"
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

import {
  ProductVariantID,
  productVariantIDDecoder,
} from "../../../App/ProductVariant/ProductVariantID"
import { SKU, skuDecoder } from "../../../App/ProductVariant/ProductVarirantSKU"
import { Stock, stockDecoder } from "../../../App/ProductVariant/Stock"

import { Maybe, maybeDecoder } from "../../../Data/Maybe"

export type Contract = AuthApi<
  AuthSeller,
  "PUT",
  "/seller/product/:id",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: ProductID
}

export type UpdateVariantBody = {
  id: Maybe<ProductVariantID>
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
  variants: UpdateVariantBody[]
}

export type ErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "SKU_ALREADY_EXISTS"
  | "FORBIDDEN_ACTION"

export type Payload = {
  product: DetailProduct
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  product: productDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_NOT_FOUND",
  "CATEGORY_NOT_FOUND",
  "SKU_ALREADY_EXISTS",
  "FORBIDDEN_ACTION",
])

export const updateVariantBodyDecoder: JD.Decoder<UpdateVariantBody> =
  JD.object({
    id: maybeDecoder(productVariantIDDecoder),
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
  variants: JD.array(updateVariantBodyDecoder),
})

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: productIDDecoder,
})

export const contract: Contract = {
  method: "PUT",
  route: "/seller/product/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
