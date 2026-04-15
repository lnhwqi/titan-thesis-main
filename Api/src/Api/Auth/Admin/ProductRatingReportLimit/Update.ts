import * as API from "../../../../../../Core/Api/Auth/Admin/ProductRatingReportLimit/Update"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as MarketConfigRow from "../../../../Database/MarketConfigRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (params.ratingReportMaxPerDay.unwrap() <= 0) {
    return err("INVALID_RATING_REPORT_LIMIT")
  }

  const updated = await MarketConfigRow.updateRatingReportMaxPerDay(
    params.ratingReportMaxPerDay,
  )

  return ok({
    ratingReportMaxPerDay: updated.ratingReportMaxPerDay,
  })
}
