import * as API from "../../../../../../Core/Api/Auth/User/Cart/Delete"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as UserCartItemRow from "../../../../Database/UserCartItemRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<null, API.Payload>> {
  const { productID, variantID } = params

  const deleted = await UserCartItemRow.remove(user.id, productID, variantID)

  return ok({ productID, variantID, deleted })
}
