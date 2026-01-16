import * as API from "../../../../../Core/Api/Public/Product/Search"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import * as ProductCategoryRow from "../../../Database/ProductCategoryRow"
import { toBasicProduct } from "../../../App/ProductBasic"
import { BasicProduct } from "../../../../../Core/App/ProductBasic"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const searchName = params.name?.trim() ?? ""

  let productRows: ProductRow.ProductRow[] = []

  if (searchName.length > 0) {
    productRows = await ProductRow.searchByName(searchName)
  } else {
    productRows = []
  }

  if (productRows.length === 0) {
    return err("PRODUCT_NOT_FOUND")
  }

  const payload = await getlistPayload(productRows)

  return ok(payload)
}

export async function getlistPayload(
  productRows: ProductRow.ProductRow[],
): Promise<API.Payload> {
  const productIds = productRows.map((p) => p.id)

  if (productIds.length === 0) return { items: [] }

  const [allImages, allCategories] = await Promise.all([
    ProductImageRow.getByProductIDs(productIds),
    ProductCategoryRow.getByProductIDs(productIds),
  ])

  const imageMap = _groupBy(allImages, (img) => img.productID.unwrap())
  const categoryMap = _groupBy(allCategories, (cat) => cat.productID.unwrap())

  const products: BasicProduct[] = productRows.map((row) => {
    const idStr = row.id.unwrap()
    const images = imageMap[idStr] ?? []
    const categories = categoryMap[idStr] ?? []

    return toBasicProduct(row, images[0], categories)
  })

  return { items: products }
}

function _groupBy<T>(
  array: T[],
  keyGetter: (item: T) => string,
): Record<string, T[]> {
  const obj: Record<string, T[]> = {}
  array.forEach((item) => {
    const key = keyGetter(item)
    if (!obj[key]) obj[key] = []
    obj[key].push(item)
  })
  return obj
}
