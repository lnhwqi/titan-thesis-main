import { BasicProduct } from "../../../Core/App/ProductBasic"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"
import { ProductVariant } from "../../../Core/App/ProductVariant"
import { ShopName } from "../../../Core/App/Seller/ShopName"
export function toBasicProduct(
  productRow: ProductRow,
  productImageRow: ProductImageRow,
  categoryRows: ProductCategoryRow,
  shopName: ShopName | undefined,
  variants: ProductVariant[],
): BasicProduct {
  return {
    id: productRow.id,
    sellerID: productRow.sellerId,
    shopName,
    name: productRow.name,
    price: productRow.price,
    url: productImageRow.url,
    categoryID: categoryRows.categoryID,
    variants: variants,
  }
}
