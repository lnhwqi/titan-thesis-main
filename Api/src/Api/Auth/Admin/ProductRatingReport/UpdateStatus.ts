import * as API from "../../../../../../Core/Api/Auth/Admin/ProductRatingReport/UpdateStatus"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { ProductRatingReportStatus } from "../../../../../../Core/App/ProductRatingReport"
import { AuthAdmin } from "../../../AuthApi"
import * as ProductRatingReportRow from "../../../../Database/ProductRatingReportRow"
import { toProductRatingReport } from "../../../../App/ProductRatingReport"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const current = await ProductRatingReportRow.getByID(params.id)
  if (current == null) {
    return err("PRODUCT_RATING_REPORT_NOT_FOUND")
  }

  if (canTransition(current.status, params.status) === false) {
    return err("INVALID_STATUS_TRANSITION")
  }

  const updated = await ProductRatingReportRow.updateStatus(
    params.id,
    params.status,
  )

  if (updated == null) {
    return err("PRODUCT_RATING_REPORT_NOT_FOUND")
  }

  return ok({ report: toProductRatingReport(updated) })
}

function canTransition(
  from: ProductRatingReportStatus,
  to: Exclude<ProductRatingReportStatus, "OPEN">,
): boolean {
  if (from === "APPROVED_DELETE" || from === "REJECTED") {
    return false
  }

  if (to === "UNDER_REVIEW") {
    return from === "OPEN"
  }

  if (to === "APPROVED_DELETE" || to === "REJECTED") {
    return from === "OPEN" || from === "UNDER_REVIEW"
  }

  return false
}
