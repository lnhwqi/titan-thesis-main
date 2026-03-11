import * as API from "../../../../../Core/Api/Auth/User/HomeUser"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthUser } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  return ok({ user })
}
