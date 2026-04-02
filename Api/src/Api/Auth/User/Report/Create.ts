import * as API from "../../../../../../Core/Api/Auth/User/Report/Create"
import { ok, err, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import { createReportID } from "../../../../../../Core/App/Report"
import db from "../../../../Database"
import * as ReportRow from "../../../../Database/ReportRow"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toReport } from "../../../../App/Report"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const seller = await db
    .selectFrom("seller")
    .select(["id"])
    .where("id", "=", params.sellerID.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()

  if (seller == null) {
    return err("SELLER_NOT_FOUND")
  }

  const order = await db
    .selectFrom("order_payment")
    .select(["id", "userId", "sellerId"])
    .where("id", "=", params.orderID.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()

  if (order == null) {
    return err("ORDER_PAYMENT_NOT_FOUND")
  }

  if (order.userId !== user.id.unwrap()) {
    return err("ORDER_NOT_OWNED_BY_USER")
  }

  if (order.sellerId !== params.sellerID.unwrap()) {
    return err("SELLER_NOT_FOUND")
  }

  const report = await ReportRow.create({
    id: createReportID(),
    sellerId: params.sellerID,
    userId: user.id,
    orderId: params.orderID,
    category: params.category,
    title: params.title,
    userDescription: params.userDescription,
    userUrlImgs: params.userUrlImgs,
    status: "OPEN",
  })

  await OrderPaymentRow.updateStatusByReportFlow(params.orderID, "REPORTED")

  return ok({ report: toReport(report) })
}
