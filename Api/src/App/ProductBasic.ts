import { BasicProduct } from "../../../Core/App/ProductBasic"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"

export function toBasicProduct(
  productRow: ProductRow,
  productImageRow: ProductImageRow | undefined,
  categoryRows: ProductCategoryRow[],
): BasicProduct {
  return {
    id: productRow.id,
    name: productRow.name,
    price: productRow.price,
    url: productImageRow?.url,

    categoryIDs: categoryRows.map((row) => row.categoryID),
  }
}
