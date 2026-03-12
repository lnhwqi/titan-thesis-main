import * as JD from "decoders"
import { Name, nameDecoder } from "./Product/Name"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import { Price, priceDecoder } from "./Product/Price"
import { Description, descriptionDecoder } from "./Product/Description"
import { ImageUrl, imageUrlDecoder } from "./Product/ProductImageUrl"
import { CategoryID, categoryIDDecoder } from "./Category/CategoryID"
import { ProductVariant, productVariantDecoder } from "./ProductVariant"
import {
  ProductAttributes,
  productAttributesDecoder,
} from "./Product/Attributes"

export type DetailProduct = {
  id: ProductID
  sellerID: SellerID
  name: Name
  price: Price
  description: Description
  urls: ImageUrl[]
  categoryID: CategoryID
  attributes: ProductAttributes
  variants: ProductVariant[]
}

export const productDecoder: JD.Decoder<DetailProduct> = JD.object({
  id: productIDDecoder,
  sellerID: sellerIDDecoder,
  name: nameDecoder,
  price: priceDecoder,
  description: descriptionDecoder,
  urls: JD.array(imageUrlDecoder),
  categoryID: categoryIDDecoder,
  attributes: productAttributesDecoder,
  variants: JD.array(productVariantDecoder),
})
