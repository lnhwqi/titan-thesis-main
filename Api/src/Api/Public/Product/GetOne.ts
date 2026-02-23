import * as API from "../../../../../Core/Api/Public/Product/GetOne"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import * as ProductCategoryRow from "../../../Database/ProductCategoryRow"
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

  const [imagesResult, categoriesResult] = await Promise.all([
    ProductImageRow.getByProductID(productRow.id),
    ProductCategoryRow.getByProductID(productRow.id),
  ])

  const images = imagesResult ?? []
  const categories = categoriesResult ?? []

  const product: DetailProduct = toDetailProduct(productRow, images, categories)

  return ok(product)
}

export async function getProductPayload(
  productRow: ProductRow.ProductRow,
  productImageRows: ProductImageRow.ProductImageRow[],
  productCategoryRows: ProductCategoryRow.ProductCategoryRow[],
): Promise<API.Payload> {
  return toDetailProduct(productRow, productImageRows, productCategoryRows)
}
