import * as API from "../../../../../Core/Api/Public/Product/GetOne"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import { toProduct } from "../../../App/Product"
import { Product } from "../../../../../Core/App/Product"

export const contract = API.contract

export type ProductWithImages = ProductRow.ProductRow & {
  images: ProductImageRow.ProductImageRow[]
}

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = params

  const productRow = await ProductRow.getByID(id)

  if (productRow == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  const imagesResult = await ProductImageRow.getByProductID(productRow.id)
  const images = imagesResult ?? []

  const product: Product = toProduct(productRow, images)

  return ok(product)
}

export async function getProductPayload(
  productRow: ProductRow.ProductRow,
  productImageRows: ProductImageRow.ProductImageRow[],
): Promise<API.Payload> {
  const product: Product = toProduct(productRow, productImageRows)
  return product
}
