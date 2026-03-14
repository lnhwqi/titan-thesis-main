import * as JD from "decoders"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "././ProductVariant/ProductVariantID"
import { Name, nameDecoder } from "./ProductVariant/ProductVariantName"
import { SKU, skuDecoder } from "./ProductVariant/ProductVarirantSKU"
import { Price, priceDecoder } from "./ProductVariant/ProductVariantPrice"
import { Stock, stockDecoder } from "./ProductVariant/Stock"
import { ProductID, productIDDecoder } from "./Product/ProductID"

export type ProductVariant = {
  id: ProductVariantID
  productID: ProductID
  name: Name
  sku: SKU
  price: Price
  stock: Stock
}

export const productVariantDecoder: JD.Decoder<ProductVariant> = JD.object({
  id: productVariantIDDecoder,
  productID: productIDDecoder,
  name: nameDecoder,
  sku: skuDecoder,
  price: priceDecoder,
  stock: stockDecoder,
})
