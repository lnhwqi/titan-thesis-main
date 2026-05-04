import { DetailProduct } from "../../../Core/App/ProductDetail"
import { ProductRow } from "../Database/ProductRow"
import { ProductImageRow } from "../Database/ProductImageRow"
import { ProductCategoryRow } from "../Database/ProductCategoryRow"
import { ProductVariant } from "../../../Core/App/ProductVariant"
import { Price, createPrice } from "../../../Core/App/Product/Price"

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
    price: toMinVariantPrice(variants, productRow.price),
    description: productRow.description,
    urls: productImageRows.map((imageRow) => imageRow.url),
    categoryID: categoryRow.categoryID,
    attributes: productRow.attributes,
    variants: variants,
  }
}
