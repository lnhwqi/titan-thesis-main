import * as API from "../../../../../../Core/Api/Auth/User/Wishlist/Save"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as ProductRow from "../../../../Database/ProductRow"
import * as UserWishlistProductRow from "../../../../Database/UserWishlistProductRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { productID } = params

  const product = await ProductRow.getByID(productID)
  if (product == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  await UserWishlistProductRow.save(user.id, productID)

  return ok({ productID })
}
