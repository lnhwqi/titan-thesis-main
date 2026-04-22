import * as API from "../../../../../../Core/Api/Auth/User/ProductRating/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as ProductRatingRow from "../../../../Database/ProductRatingRow"
import { toProductRating } from "../../../../App/ProductRating"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await ProductRatingRow.getByUserID(user.id)

  return ok({
    ratings: rows.map(toProductRating),
  })
}
