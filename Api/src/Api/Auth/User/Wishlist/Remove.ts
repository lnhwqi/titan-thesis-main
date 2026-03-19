import * as API from "../../../../../../Core/Api/Auth/User/Wishlist/Remove"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as UserWishlistProductRow from "../../../../Database/UserWishlistProductRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { productID } = params

  await UserWishlistProductRow.remove(user.id, productID)

  return ok({ productID })
}
