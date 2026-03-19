import * as API from "../../../../../../Core/Api/Auth/User/Cart/Add"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as ProductRow from "../../../../Database/ProductRow"
import * as ProductVariantRow from "../../../../Database/ProductVariantRow"
import * as UserCartItemRow from "../../../../Database/UserCartItemRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { productID, variantID } = params

  const product = await ProductRow.getByID(productID)
  if (product == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  const variant = await ProductVariantRow.getByID(variantID)
  if (variant == null) {
    return err("VARIANT_NOT_FOUND")
  }

  if (variant.productID.unwrap() !== productID.unwrap()) {
    return err("VARIANT_NOT_IN_PRODUCT")
  }

  const existingQuantity = await UserCartItemRow.getQuantity(
    user.id,
    productID,
    variantID,
  )
  const nextQuantity = (existingQuantity ?? 0) + 1

  if (nextQuantity > variant.stock.unwrap()) {
    return err("OUT_OF_STOCK")
  }

  const quantity = await UserCartItemRow.addOrIncrement(
    user.id,
    productID,
    variantID,
  )

  return ok({
    productID,
    variantID,
    quantity,
  })
}
