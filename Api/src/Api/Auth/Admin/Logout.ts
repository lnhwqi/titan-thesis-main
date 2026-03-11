import * as API from "../../../../../Core/Api/Auth/Admin/Logout"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"

export const contract = API.contract

export async function handler(
  admin: AuthAdmin,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  await RefreshTokenRow.removeAllByUser(admin.id)

  return ok({})
}
