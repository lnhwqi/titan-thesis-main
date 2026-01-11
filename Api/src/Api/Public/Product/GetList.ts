import * as API from "../../../../../Core/Api/Public/Product/GetList"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import { toBasicProduct } from "../../../App/BasicProduct"
import { UrlParams } from "../../../../../Core/Api/Public/Product/GetList"
import { BasicProduct } from "../../../../../Core/App/BasicProduct"
import * as ProductImageRow from "../../../Database/ProductImageRow"

export const contract = API.contract

export async function handler(
  _params: UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const productRows = await ProductRow.getAll()
  if (productRows.length === 0) {
    return err("NO_PRODUCTS_FOUND")
  }

  return ok(await getlistPayload(productRows))
}

export async function getlistPayload(
  productRows: ProductRow.ProductRow[],
): Promise<API.Payload> {
  const productsWithImagePromises = productRows.map(async (row) => {
    const imagesResult = await ProductImageRow.getByProductID(row.id)
    const images: ProductImageRow.ProductImageRow[] = imagesResult ?? []
    const firstImage = images.length > 0 ? [images[0]] : []
    return toBasicProduct(row, firstImage[0])
  })
  const products: BasicProduct[] = await Promise.all(productsWithImagePromises)
  return { items: products }
}
