import { BasicProduct } from "../../../Core/App/BasicProduct"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"

export function toBasicProduct(
  productRow: ProductRow,
  productImageRow: ProductImageRow | undefined,
): BasicProduct {
  return {
    id: productRow.id,
    name: productRow.name,
    price: productRow.price,
    url: productImageRow?.url,
  }
}
