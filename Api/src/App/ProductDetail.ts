import { DetailProduct } from "../../../Core/App/ProductDetail"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"

export function toDetailProduct(
  productRow: ProductRow,
  productImageRows: ProductImageRow[],
  categoryRows: ProductCategoryRow[],
): DetailProduct {
  return {
    id: productRow.id,
    sellerID: productRow.sellerId,
    name: productRow.name,
    price: productRow.price,
    description: productRow.description,
    urls: productImageRows.map((imageRow) => imageRow.url),
    categoryIDs: categoryRows.map((cateRow) => cateRow.categoryID),
  }
}
