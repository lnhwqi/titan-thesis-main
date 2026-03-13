import { DetailProduct } from "../../../Core/App/ProductDetail"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"
import { ProductVariant } from "../../../Core/App/ProductVariant"

export function toDetailProduct(
  productRow: ProductRow,
  productImageRows: ProductImageRow[],
  categoryRow: ProductCategoryRow,
  variants: ProductVariant[],
): DetailProduct {
  return {
    id: productRow.id,
    sellerID: productRow.sellerId,
    name: productRow.name,
    price: productRow.price,
    description: productRow.description,
    urls: productImageRows.map((imageRow) => imageRow.url),
    categoryID: categoryRow.categoryID,
    attributes: productRow.attributes,
    variants: variants,
  }
}
