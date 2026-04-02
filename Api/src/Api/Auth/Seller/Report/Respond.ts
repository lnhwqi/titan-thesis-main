import * as API from "../../../../../../Core/Api/Auth/Seller/Report/Respond"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import { ReportStatus } from "../../../../../../Core/App/Report"
import * as ReportRow from "../../../../Database/ReportRow"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toReport } from "../../../../App/Report"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const report = await ReportRow.getByID(params.id)
  if (report == null) {
    return err("REPORT_NOT_FOUND")
  }

  if (report.sellerId.unwrap() !== seller.id.unwrap()) {
    return err("REPORT_NOT_FOR_SELLER")
  }

  const nextStatus: ReportStatus =
    params.action === "SUBMIT_EVIDENCE" ? "SELLER_REPLIED" : "REFUND_APPROVED"

  if (canTransition(report.status, nextStatus) === false) {
    return err("INVALID_STATUS_TRANSITION")
  }

  const updated = await ReportRow.updateSellerResponse(
    params.id,
    seller.id,
    nextStatus,
    params.sellerDescription,
    params.sellerUrlImgs,
  )

  if (updated == null) {
    return err("REPORT_NOT_FOUND")
  }

  await OrderPaymentRow.updateStatusByReportFlow(
    updated.orderId,
    mapReportStatusToOrderPaymentStatus(updated.status),
  )

  return ok({ report: toReport(updated) })
}

function mapReportStatusToOrderPaymentStatus(status: ReportStatus): "REPORTED" | "DELIVERY_ISSUE" {
  switch (status) {
    case "OPEN":
    case "SELLER_REPLIED":
    case "UNDER_REVIEW":
    case "REFUND_APPROVED":
      return "REPORTED"
    case "CASHBACK_COMPLETED":
    case "RESOLVED":
    case "REJECTED":
      return "DELIVERY_ISSUE"
  }
}

function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  if (
    from === "RESOLVED" ||
    from === "REJECTED" ||
    from === "CASHBACK_COMPLETED"
  ) {
    return false
  }

  if (to === "SELLER_REPLIED") {
    return from === "OPEN" || from === "UNDER_REVIEW"
  }

  if (to === "REFUND_APPROVED") {
    return (
      from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
    )
  }

  return false
}
