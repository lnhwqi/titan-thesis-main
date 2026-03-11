import * as API from "../../../../../Core/Api/Auth/Admin/HomeAdmin"

import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  return ok({ admin })
}
