import * as API from "../../../../../Core/Api/Auth/Admin/ListAllSellers"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
import { toSeller } from "../../../App/Seller"
import { AuthAdmin } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const sellers = await SellerRow.listAll()
  return ok({ sellers: sellers.map(toSeller) })
}
