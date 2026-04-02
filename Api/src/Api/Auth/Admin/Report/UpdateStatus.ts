import * as API from "../../../../../../Core/Api/Auth/Admin/Report/UpdateStatus"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import { ReportStatus } from "../../../../../../Core/App/Report"
import * as ReportRow from "../../../../Database/ReportRow"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toReport } from "../../../../App/Report"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const current = await ReportRow.getByID(params.id)
  if (current == null) {
    return err("REPORT_NOT_FOUND")
  }

  if (canTransition(current.status, params.status) === false) {
    return err("INVALID_STATUS_TRANSITION")
  }

  const updated = await ReportRow.updateAdminStatus(
    params.id,
    params.status,
    params.resultTextAdmin,
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

function mapReportStatusToOrderPaymentStatus(
  status: ReportStatus,
): "REPORTED" | "DELIVERY_ISSUE" {
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
    from === "REJECTED" ||
    from === "RESOLVED" ||
    from === "CASHBACK_COMPLETED"
  ) {
    return false
  }

  if (to === "UNDER_REVIEW") {
    return from === "OPEN" || from === "SELLER_REPLIED"
  }

  if (to === "REFUND_APPROVED") {
    return (
      from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
    )
  }

  if (to === "CASHBACK_COMPLETED") {
    return from === "REFUND_APPROVED"
  }

  if (to === "RESOLVED") {
    return from === "UNDER_REVIEW" || from === "REFUND_APPROVED"
  }

  if (to === "REJECTED") {
    return (
      from === "OPEN" || from === "SELLER_REPLIED" || from === "UNDER_REVIEW"
    )
  }

  return from === to
}
