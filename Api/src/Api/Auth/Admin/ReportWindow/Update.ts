import * as API from "../../../../../../Core/Api/Auth/Admin/ReportWindow/Update"
import { Result, err, ok } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as MarketConfigRow from "../../../../Database/MarketConfigRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (params.reportWindowHours.unwrap() <= 0) {
    return err("INVALID_REPORT_WINDOW")
  }

  const updated = await MarketConfigRow.updateReportWindowHours(
    params.reportWindowHours,
  )

  return ok({
    reportWindowHours: updated.reportWindowHours,
  })
}
