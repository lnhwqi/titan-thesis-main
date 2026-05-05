import * as API from "../../../../../../Core/Api/Auth/Admin/Report/UpdateStatus"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import { ReportStatus } from "../../../../../../Core/App/Report"
import * as ReportRow from "../../../../Database/ReportRow"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toReport } from "../../../../App/Report"
import { randomUUID } from "node:crypto"
import db from "../../../../Database"

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

  if (params.status === "CASHBACK_COMPLETED") {
    const order = await OrderPaymentRow.getByID(updated.orderId)
    if (order == null) {
      return err("REPORT_NOT_FOUND")
    }

    const refundAmount = order.price.unwrap()
    const now = new Date()

    await db.transaction().execute(async (trx) => {
      // Insert audit record — UNIQUE(orderID) prevents double-credit on retry
      await trx
        .insertInto("order_cancellation_refund")
        .values({
          id: randomUUID(),
          orderID: order.id.unwrap(),
          userID: updated.userId.unwrap(),
          amount: refundAmount,
          reason: "REPORT_CASHBACK",
          createdAt: now,
        })
        .onConflict((oc) => oc.column("orderID").doNothing())
        .execute()

      // Credit the user's wallet
      await trx
        .updateTable("user")
        .set((eb) => ({
          wallet: eb("wallet", "+", refundAmount),
          updatedAt: now,
        }))
        .where("id", "=", updated.userId.unwrap())
        .where("isDeleted", "=", false)
        .execute()

      // Debit the admin's wallet
      await trx
        .updateTable("admin")
        .set((eb) => ({
          wallet: eb("wallet", "-", refundAmount),
          updatedAt: now,
        }))
        .where("id", "=", _admin.id.unwrap())
        .where("isDeleted", "=", false)
        .where("wallet", ">=", refundAmount)
        .execute()
    })
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
    return (
      from === "OPEN" ||
      from === "SELLER_REPLIED" ||
      from === "UNDER_REVIEW" ||
      from === "REFUND_APPROVED"
    )
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
