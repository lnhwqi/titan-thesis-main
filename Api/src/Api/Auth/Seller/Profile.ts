import * as API from "../../../../../Core/Api/Auth/Seller/SellerProfile"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  _params: API.BodyParams & API.UrlParams,
): Promise<Result<null, API.Payload>> {
  return ok({ seller })
}
