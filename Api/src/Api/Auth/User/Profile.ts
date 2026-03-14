import * as API from "../../../../../Core/Api/Auth/User/Profile"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthUser } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.BodyParams & API.UrlParams,
): Promise<Result<null, API.Payload>> {
  return ok({ user })
}
