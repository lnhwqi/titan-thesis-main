import * as API from "../../../../../Core/Api/Auth/HomeAdmin"
import { NoBodyParams } from "../../../../../Core/Data/Api"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  admin: AuthAdmin,
  _params: NoBodyParams,
): Promise<Result<null, API.Payload>> {
  return ok({ admin })
}
