import * as API from "../../../../../../Core/Api/Auth/User/Wishlist/List"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as UserWishlistProductRow from "../../../../Database/UserWishlistProductRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const productIDs = await UserWishlistProductRow.listProductIDsByUserID(
    user.id,
  )
  return ok({ productIDs })
}
