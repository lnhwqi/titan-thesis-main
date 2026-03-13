import { BasicProduct } from "../../../Core/App/ProductBasic"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"
import { ProductVariant } from "../../../Core/App/ProductVariant"
export function toBasicProduct(
  productRow: ProductRow,
  productImageRow: ProductImageRow,
  categoryRows: ProductCategoryRow,
  variants: ProductVariant[],
): BasicProduct {
  return {
    id: productRow.id,
    sellerID: productRow.sellerId,
    name: productRow.name,
    price: productRow.price,
    url: productImageRow.url,
    categoryID: categoryRows.categoryID,
    variants: variants,
  }
}
