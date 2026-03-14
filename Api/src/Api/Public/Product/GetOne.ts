import * as API from "../../../../../Core/Api/Public/Product/GetOne"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import * as ProductCategoryRow from "../../../Database/ProductCategoryRow"
import * as ProductVariantRow from "../../../Database/ProductVariantRow"
import { toDetailProduct } from "../../../App/ProductDetail"
import { DetailProduct } from "../../../../../Core/App/ProductDetail"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = params

  const productRow = await ProductRow.getByID(id)
  if (productRow == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  const [images, categoryRow, variantRows] = await Promise.all([
    ProductImageRow.getByProductID(productRow.id),
    ProductCategoryRow.getByProductID(productRow.id),
    ProductVariantRow.getByProductID(productRow.id),
  ])

  if (categoryRow == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  const product: DetailProduct = toDetailProduct(
    productRow,
    images ?? [],
    categoryRow,
    variantRows ?? [],
  )

  return ok(product)
}

export async function getProductPayload(
  productRow: ProductRow.ProductRow,
  productImageRows: ProductImageRow.ProductImageRow[],
  categoryRow: ProductCategoryRow.ProductCategoryRow,
  variantRows: ProductVariantRow.ProductVariantRow[],
): Promise<API.Payload> {
  return toDetailProduct(productRow, productImageRows, categoryRow, variantRows)
}
