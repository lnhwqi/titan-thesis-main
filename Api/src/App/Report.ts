import { Report } from "../../../Core/App/Report"
import { ReportRow } from "../Database/ReportRow"
import { toMillisecond } from "../../../Core/Data/Time/Timestamp"

export function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    sellerID: row.sellerId,
    userID: row.userId,
    orderID: row.orderId,
    category: row.category,
    title: row.title,
    userDescription: row.userDescription,
    userUrlImgs: row.userUrlImgs,
    sellerDescription: row.sellerDescription,
    sellerUrlImgs: row.sellerUrlImgs,
    status: row.status,
    resultTextAdmin: row.resultTextAdmin,
    createdAt: toMillisecond(row.createdAt),
  }
}
