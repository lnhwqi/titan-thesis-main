import * as API from "../../../../../../Core/Api/Auth/Admin/ProductRatingWindow/Update"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as MarketConfigRow from "../../../../Database/MarketConfigRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (params.productRatingWindowHours.unwrap() <= 0) {
    return err("INVALID_PRODUCT_RATING_WINDOW")
  }

  const updated = await MarketConfigRow.updateReportWindowHours(
    params.productRatingWindowHours,
  )

  return ok({
    productRatingWindowHours: updated.reportWindowHours,
  })
}
