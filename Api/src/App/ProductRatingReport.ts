import { ProductRatingReport } from "../../../Core/App/ProductRatingReport"
import { ProductRatingReportRow } from "../Database/ProductRatingReportRow"

export function toProductRatingReport(
  row: ProductRatingReportRow,
): ProductRatingReport {
  return {
    id: row.id,
    orderID: row.orderId,
    productID: row.productId,
    reporterSellerID: row.reporterSellerId,
    reason: row.reason,
    detail: row.detail,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  }
}
