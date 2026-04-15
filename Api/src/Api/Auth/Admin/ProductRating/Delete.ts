import * as API from "../../../../../../Core/Api/Auth/Admin/ProductRating/Delete"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as ProductRatingRow from "../../../../Database/ProductRatingRow"
import * as ProductRatingReportRow from "../../../../Database/ProductRatingReportRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rating = await ProductRatingRow.getByOrderProduct(
    params.orderID,
    params.productID,
  )

  if (rating == null) {
    return err("RATING_NOT_FOUND")
  }

  const report = await ProductRatingReportRow.findLatestByOrderProduct(
    params.orderID,
    params.productID,
  )

  if (report == null) {
    return err("PRODUCT_RATING_REPORT_NOT_FOUND")
  }

  if (report.status !== "APPROVED_DELETE") {
    return err("RATING_REPORT_NOT_APPROVED")
  }

  const deleted = await ProductRatingRow.softDeleteByOrderProduct(
    params.orderID,
    params.productID,
  )

  if (deleted == null) {
    return err("RATING_NOT_FOUND")
  }

  return ok({
    orderID: params.orderID,
    productID: params.productID,
    deleted: true,
  })
}
