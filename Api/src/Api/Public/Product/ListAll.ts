import * as API from "../../../../../Core/Api/Public/Product/ListAll"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import * as ProductCategoryRow from "../../../Database/ProductCategoryRow"
import { toBasicProduct } from "../../../App/ProductBasic"
import { UrlParams } from "../../../../../Core/Api/Public/Product/ListAll"
import { BasicProduct } from "../../../../../Core/App/ProductBasic"
import * as ProductVariantRow from "../../../Database/ProductVariantRow"
import * as SellerRow from "../../../Database/SellerRow"
import * as Logger from "../../../Logger"
export const contract = API.contract

export async function handler(
  params: UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const categoryID = params.categoryID?.trim()
  const keyword = params.name?.trim()
  const page = params.page ?? 1
  const limit = params.limit ?? 10
  const sortBy = params.sortBy ?? "newest"

  const { rows: productRows, total } = await ProductRow.getFilteredAndSorted({
    categoryID,
    name: keyword,
    page,
    limit,
    sortBy,
  })

  if (productRows.length === 0) {
    return ok({
      items: [],
      page,
      limit,
      totalCount: total,
    })
  }

  const payload = await getlistPayload(productRows)
  const items = payload.items

  return ok({
    items,
    page,
    limit,
    totalCount: total,
  })
}

export async function getlistPayload(
  productRows: ProductRow.ProductRow[],
): Promise<{ items: BasicProduct[] }> {
  const productIds = productRows.map((p) => p.id)
  const sellerIDs = productRows.map((p) => p.sellerId)

  const safeLoad = async <T>(
    label: string,
    fn: () => Promise<T[]>,
  ): Promise<T[]> => {
    try {
      return await fn()
    } catch (e) {
      Logger.warn(`#public.product.listAll skip ${label}: ${e}`)
      return []
    }
  }

  const [allImages, allCategories, allVariants, allSellers] = await Promise.all(
    [
      safeLoad("productImage", () =>
        ProductImageRow.getByProductIDs(productIds),
      ),
      safeLoad("productCategory", () =>
        ProductCategoryRow.getByProductIDs(productIds),
      ),
      safeLoad("productVariant", () =>
        ProductVariantRow.getByProductIDs(productIds),
      ),
      safeLoad("seller", () => SellerRow.getByIDs(sellerIDs)),
    ],
  )

  const imageMap = _groupBy(allImages, (img) => String(img.productID.unwrap()))
  const categoryMap = _groupBy(allCategories, (cat) =>
    String(cat.productID.unwrap()),
  )
  const variantMap = _groupBy(allVariants, (v) => String(v.productID.unwrap()))
  const sellerMap = new Map(
    allSellers.map((seller) => [seller.id.unwrap(), seller.shopName]),
  )

  const products: BasicProduct[] = []
  for (const row of productRows) {
    const idStr = String(row.id.unwrap())

    const images = imageMap[idStr] ?? []
    const categories = categoryMap[idStr] ?? []
    const variantRows = variantMap[idStr] ?? []
    const shopName = sellerMap.get(row.sellerId.unwrap())

    const firstImage = images[0]
    const firstCategory = categories[0]

    if (firstImage == null || firstCategory == null) {
      Logger.warn(
        `#public.product.listAll skip incomplete product id=${idStr} missing ${firstImage == null ? "image" : ""}${firstImage == null && firstCategory == null ? "+" : ""}${firstCategory == null ? "category" : ""}`,
      )
      continue
    }

    products.push(
      toBasicProduct(row, firstImage, firstCategory, shopName, variantRows),
    )
  }

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
