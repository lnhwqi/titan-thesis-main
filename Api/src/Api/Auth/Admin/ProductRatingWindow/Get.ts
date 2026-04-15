import * as API from "../../../../../../Core/Api/Auth/Admin/ProductRatingWindow/Get"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as MarketConfigRow from "../../../../Database/MarketConfigRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const config = await MarketConfigRow.getOrCreate()

  return ok({
    productRatingWindowHours: config.reportWindowHours,
  })
}
