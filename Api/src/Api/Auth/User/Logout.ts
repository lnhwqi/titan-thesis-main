import * as API from "../../../../../Core/Api/Auth/User/Logout"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthUser } from "../../AuthApi"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  await RefreshTokenRow.removeAllByUser(user.id)

  return ok({})
}
