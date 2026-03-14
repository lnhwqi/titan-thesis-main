import { ProductVariant } from "../../../Core/App/ProductVariant"
import { ProductVariantRow } from "../Database/ProductVariantRow"

export function toProductVariant(
  ProductVariantRow: ProductVariantRow,
): ProductVariant {
  return {
    id: ProductVariantRow.id,
    productID: ProductVariantRow.productID,
    name: ProductVariantRow.name,
    sku: ProductVariantRow.sku,
    price: ProductVariantRow.price,
    stock: ProductVariantRow.stock,
  }
}

export function toProductVariants(rows: ProductVariantRow[]): ProductVariant[] {
  return rows.map(toProductVariant)
}
