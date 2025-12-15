import { Product } from "../../../Core/App/Product"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"

export function toProduct(
  productRow: ProductRow,
  productImageRows: ProductImageRow[],
): Product {
  return {
    id: productRow.id,
    name: productRow.name,
    price: productRow.price,
    description: productRow.description,
    urls: productImageRows.map((imageRow) => imageRow.url),
  }
}
