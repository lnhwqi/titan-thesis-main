import * as API from "../../../../../Core/Api/Auth/Admin/ListAllUsers"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as UserRow from "../../../Database/UserRow"
import { toUser } from "../../../App/User"
import { AuthAdmin } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const users = await UserRow.listAll()
  return ok({ users: users.map(toUser) })
}
