import * as JD from "decoders"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "./ProductVariant/ProductVariantID"
import { Name, nameDecoder } from "./Product/Name"
import {
  ProductVariantName,
  productVariantNameDecoder,
} from "./ProductVariant/ProductVariantName"
import { Stock, stockDecoder } from "./ProductVariant/Stock"

export type OrderPaymentItem = {
  productID: ProductID
  variantID: ProductVariantID
  productName: Name
  variantName: ProductVariantName
  quantity: Stock
}

export const orderPaymentItemDecoder: JD.Decoder<OrderPaymentItem> = JD.object({
  productID: productIDDecoder,
  variantID: productVariantIDDecoder,
  productName: nameDecoder,
  variantName: productVariantNameDecoder,
  quantity: stockDecoder,
})
