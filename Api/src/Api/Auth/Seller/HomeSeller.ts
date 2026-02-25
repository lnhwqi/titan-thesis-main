import * as API from "../../../../../Core/Api/Auth/HomeSeller"
import { NoBodyParams } from "../../../../../Core/Data/Api"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  _params: NoBodyParams,
): Promise<Result<null, API.Payload>> {
  return ok({ seller })
}
