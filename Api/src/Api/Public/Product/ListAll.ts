import * as API from "../../../../../Core/Api/Public/Product/ListAll"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import * as ProductCategoryRow from "../../../Database/ProductCategoryRow"
import { toBasicProduct } from "../../../App/ProductBasic"
import { UrlParams } from "../../../../../Core/Api/Public/Product/ListAll"
import { BasicProduct } from "../../../../../Core/App/ProductBasic"

export const contract = API.contract

export async function handler(
  _params: UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  // 1. Lấy tất cả thông tin cơ bản của sản phẩm (Query 1)
  const productRows = await ProductRow.getAll()

  if (productRows.length === 0) {
    return err("NO_PRODUCTS_FOUND")
  }

  return ok(await getlistPayload(productRows))
}

export async function getlistPayload(
  productRows: ProductRow.ProductRow[],
): Promise<API.Payload> {
  const productIds = productRows.map((p) => p.id)

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
