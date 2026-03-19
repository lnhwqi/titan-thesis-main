import * as API from "../../../../../../Core/Api/Auth/User/Cart/UpdateQuantity"
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
  const { productID, variantID, quantity } = params

  if (Number.isInteger(quantity) === false || quantity <= 0) {
    return err("INVALID_QUANTITY")
  }

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

  if (quantity > variant.stock.unwrap()) {
    return err("OUT_OF_STOCK")
  }

  const updated = await UserCartItemRow.setQuantity(
    user.id,
    productID,
    variantID,
    quantity,
  )

  if (updated === false) {
    return err("CART_ITEM_NOT_FOUND")
  }

  return ok({
    productID,
    variantID,
    quantity,
  })
}
