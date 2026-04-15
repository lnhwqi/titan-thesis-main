import { ProductRatingReport } from "../../../Core/App/ProductRatingReport"
import { toMillisecond } from "../../../Core/Data/Time/Timestamp"
import { ProductRatingReportRow } from "../Database/ProductRatingReportRow"

export function toProductRatingReport(
  row: ProductRatingReportRow,
): ProductRatingReport {
  return {
    id: row.id,
    orderID: row.orderId,
    productID: row.productId,
    reporterUserID: row.reporterUserId,
    reason: row.reason,
    detail: row.detail,
    status: row.status,
    createdAt: toMillisecond(row.createdAt),
    reviewedAt: row.reviewedAt == null ? null : toMillisecond(row.reviewedAt),
  }
}
