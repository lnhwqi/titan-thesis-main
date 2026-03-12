import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

// Các Import từ Domain Sản phẩm
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
} from "../../../App/ProductDetail"

// Các Import cho Variant
import { SKU, skuDecoder } from "../../../App/ProductVariant/ProductVarirantSKU"
import { Stock, stockDecoder } from "../../../App/ProductVariant/Stock"

// Re-export theo đúng format chuẩn của bạn
export { NoUrlParams, noUrlParamsDecoder }

// 1. CONTRACT (Sử dụng AuthApi và AuthSeller)
export type Contract = AuthApi<
  AuthSeller,
  "POST",
  "/seller/product", // Hoặc "/seller/products" tùy convention của bạn
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

// 2. BODY PARAMS
export type CreateVariantBody = {
  name: Name // Dùng Value Object Name cho tên phân loại ("Đen - Size S")
  sku: SKU // Mã SKU (Bắt buộc)
  price: Price // Giá riêng của phân loại
  stock: Stock // Tồn kho
}

export type BodyParams = {
  name: Name
  price: Price
  description: Description
  urls: ImageUrl[]
  categoryID: CategoryID
  attributes: ProductAttributes
  variants: CreateVariantBody[] // Danh sách phân loại do Frontend gửi lên
}

// 3. ERROR CODES
export type ErrorCode =
  | "CATEGORY_NOT_FOUND"
  | "SKU_ALREADY_EXISTS"
  | "INVALID_PRODUCT_DATA"

// 4. PAYLOAD
export type Payload = {
  product: DetailProduct // Bọc trong object giống { voucher: Voucher }
}

// 5. DECODERS
export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  product: productDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "CATEGORY_NOT_FOUND",
  "SKU_ALREADY_EXISTS",
  "INVALID_PRODUCT_DATA",
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
