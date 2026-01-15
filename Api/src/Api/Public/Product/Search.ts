import * as API from "../../../../../Core/Api/Public/Product/Search"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageTable from "../../../Database/ProductImageRow"
import { toBasicProduct } from "../../../App/ProductBasic"
import { BasicProduct } from "../../../../../Core/App/ProductBasic"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  let productRows = await ProductRow.getAll()
  const searchName = params.name?.toLowerCase()

  if (searchName) {
    productRows = productRows.filter((row) =>
      String(row.name).toLowerCase().includes(searchName),
    )
  }

  if (productRows.length === 0) {
    return err("PRODUCT_NOT_FOUND")
  }

  return ok(await getlistPayload(productRows))
}

export async function getlistPayload(
  productRows: ProductRow.ProductRow[],
): Promise<API.Payload> {
  const productsWithImagePromises = productRows.map(async (row) => {
    const imagesResult = await ProductImageTable.getByProductID(row.id)

    const images = imagesResult ?? []

    const firstImage = images.length > 0 ? [images[0]] : []

    const product: BasicProduct = toBasicProduct(row, firstImage[0])

    return product
  })

  const products: BasicProduct[] = await Promise.all(productsWithImagePromises)
  return products
}
