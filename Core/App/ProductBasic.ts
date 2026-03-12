import * as JD from "decoders"
import { Name, nameDecoder } from "./Product/Name"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"

import { Price, priceDecoder } from "./Product/Price"
import { ImageUrl, imageUrlDecoder } from "./Product/ProductImageUrl"
import { CategoryID, categoryIDDecoder } from "./Category/CategoryID"

import { ProductVariant, productVariantDecoder } from "./ProductVariant"

export type BasicProduct = {
  id: ProductID
  sellerID: SellerID
  name: Name
  price: Price
  url: ImageUrl
  categoryID: CategoryID
  variants: ProductVariant[]
}

export const basicProductDecoder: JD.Decoder<BasicProduct> = JD.object({
  id: productIDDecoder,
  sellerID: sellerIDDecoder,
  name: nameDecoder,
  price: priceDecoder,
  url: imageUrlDecoder,
  categoryID: categoryIDDecoder,
  variants: JD.array(productVariantDecoder),
})
