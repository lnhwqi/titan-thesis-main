import * as API from "../../../../../Core/Api/Public/Product/Search"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductImageRow from "../../../Database/ProductImageRow"
import * as ProductCategoryRow from "../../../Database/ProductCategoryRow"

import * as ProductVariantRow from "../../../Database/ProductVariantRow"
import * as SellerRow from "../../../Database/SellerRow"
import * as Logger from "../../../Logger"

import { toBasicProduct } from "../../../App/ProductBasic"
import { BasicProduct } from "../../../../../Core/App/ProductBasic"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const searchName = params.name?.trim() ?? ""

  if (searchName.length === 0) {
    return ok({ items: [] })
  }

  const productRows = await ProductRow.searchByName(searchName)

  if (productRows.length === 0) {
    return ok({ items: [] })
  }

  const payload = await getlistPayload(productRows)

  return ok(payload)
}

export async function getlistPayload(
  productRows: ProductRow.ProductRow[],
): Promise<API.Payload> {
  const productIds = productRows.map((p) => p.id)
  const sellerIDs = productRows.map((p) => p.sellerId)

  if (productIds.length === 0) return { items: [] }

  const safeLoad = async <T>(
    label: string,
    fn: () => Promise<T[]>,
  ): Promise<T[]> => {
    try {
      return await fn()
    } catch (e) {
      Logger.warn(`#public.product.search skip ${label}: ${e}`)
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

  const imageMap = _groupBy(allImages, (img) => img.productID.unwrap())
  const categoryMap = _groupBy(allCategories, (cat) => cat.productID.unwrap())
  const variantMap = _groupBy(allVariants, (v) => v.productID.unwrap())
  const sellerMap = new Map(
    allSellers.map((seller) => [seller.id.unwrap(), seller.shopName]),
  )

  const products: BasicProduct[] = []
  for (const row of productRows) {
    const idStr = row.id.unwrap()

    const images = imageMap[idStr] ?? []
    const categoryRows = categoryMap[idStr] ?? []
    const variantRows = variantMap[idStr] ?? []
    const shopName = sellerMap.get(row.sellerId.unwrap())

    const firstImage = images[0]
    const firstCategory = categoryRows[0]

    if (firstImage == null || firstCategory == null) {
      Logger.warn(
        `#public.product.search skip incomplete product id=${idStr} missing ${firstImage == null ? "image" : ""}${firstImage == null && firstCategory == null ? "+" : ""}${firstCategory == null ? "category" : ""}`,
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
