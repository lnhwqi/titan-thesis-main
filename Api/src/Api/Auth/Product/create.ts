import * as API from "../../../../../Core/Api/Auth/Product/create"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"

import * as ProductTx from "../../../Transaction/ProductTx"
import * as CategoryRow from "../../../Database/CategoryRow"
import { isUniqueConstraintViolation } from "../../../Database"

import { toDetailProduct } from "../../../App/ProductDetail"
import { toProductVariant } from "../../../App/ProductVariant"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const category = await CategoryRow.getByID(params.categoryID)
  if (category == null) {
    return err("CATEGORY_NOT_FOUND")
  }

  const categoryIDRaw = category.id.toJSON()
  if (typeof categoryIDRaw !== "string" || categoryIDRaw.trim() === "") {
    return err("CATEGORY_NOT_FOUND")
  }

  try {
    const result = await ProductTx.createFull(seller.id, params, categoryIDRaw)

    const mappedVariants = result.variantRows.map(toProductVariant)

    const detailProduct = toDetailProduct(
      result.productRow,
      result.imageRows,
      result.categoryRow,
      mappedVariants,
    )

    return ok({ product: detailProduct })
  } catch (error: unknown) {
    if (error instanceof Error && isUniqueConstraintViolation(error)) {
      return err("SKU_ALREADY_EXISTS")
    }

    const dbCode =
      typeof error === "object" && error != null && "code" in error
        ? String(error.code)
        : null

    if (dbCode === "22003" || dbCode === "22P02" || dbCode === "23514") {
      return err("INVALID_PRODUCT_INPUT")
    }

    if (
      error instanceof Error &&
      (error.message.includes("out of range") ||
        error.message.includes("INVALID_PRICE") ||
        error.message.includes("INVALID_STOCK"))
    ) {
      return err("INVALID_PRODUCT_INPUT")
    }

    throw new Error(String(error))
  }
}
