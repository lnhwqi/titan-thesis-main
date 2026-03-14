import * as API from "../../../../../Core/Api/Auth/Product/update"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"

import * as ProductRow from "../../../Database/ProductRow"
import * as CategoryRow from "../../../Database/CategoryRow"
import * as ProductTx from "../../../Transaction/ProductTx"
import { toDetailProduct } from "../../../App/ProductDetail"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const productRow = await ProductRow.getByID(params.id)
  if (productRow == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  if (productRow.sellerId.unwrap() !== seller.id.unwrap()) {
    return err("FORBIDDEN_ACTION")
  }

  const categoryRow = await CategoryRow.getByID(params.categoryID)
  if (categoryRow == null) {
    return err("CATEGORY_NOT_FOUND")
  }

  try {
    const result = await ProductTx.updateFull(seller.id, params.id, params)

    const detailProduct = toDetailProduct(
      result.productRow,
      result.imageRows,
      result.categoryRow,
      result.variantRows,
    )

    return ok({ product: detailProduct })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    let errorCode: string | null = null

    if (typeof error === "object" && error !== null && "code" in error) {
      errorCode = String(error.code)
    }

    if (errorCode === "23505" || errorMessage.includes("sku")) {
      return err("SKU_ALREADY_EXISTS")
    }

    throw error
  }
}
