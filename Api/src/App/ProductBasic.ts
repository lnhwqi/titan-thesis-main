import { BasicProduct } from "../../../Core/App/ProductBasic"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"
import { ProductVariant } from "../../../Core/App/ProductVariant"
import { Price, createPrice } from "../../../Core/App/Product/Price"
import { ShopName } from "../../../Core/App/Seller/ShopName"

function toMinVariantPrice(
  variants: ProductVariant[],
  fallback: ProductRow["price"],
): Price {
  if (variants.length === 0) {
    return fallback
  }

  const minValue = variants.reduce((min, variant) => {
    return variant.price.unwrap() < min ? variant.price.unwrap() : min
  }, variants[0].price.unwrap())

  return createPrice(minValue) ?? fallback
}

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
    price: toMinVariantPrice(variants, productRow.price),
    url: productImageRow.url,
    categoryID: categoryRows.categoryID,
    variants: variants,
  }
}
