import * as API from "../../../../../Core/Api/Auth/Admin/SetUserActive"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as UserRow from "../../../Database/UserRow"
import { toUser } from "../../../App/User"
import { AuthAdmin } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const updated = await UserRow.setActive(params.userID, params.active)
  if (updated === null) return err("USER_NOT_FOUND")
  return ok({ user: toUser(updated) })
}
