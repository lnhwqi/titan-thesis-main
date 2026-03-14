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

  try {
    const result = await ProductTx.createFull(seller.id, params)

    const mappedVariants = result.variantRows.map(toProductVariant)

    const detailProduct = toDetailProduct(
      result.productRow,
      result.imageRows,
      result.categoryRow,
      mappedVariants,
    )

    return ok({ product: detailProduct })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (isUniqueConstraintViolation(error)) {
        return err("SKU_ALREADY_EXISTS")
      }
      throw error
    }
    throw new Error(String(error))
  }
}
