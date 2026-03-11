import * as API from "../../../../../Core/Api/Auth/Seller/Logout"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  await RefreshTokenRow.removeAllByUser(seller.id)

  return ok({})
}
