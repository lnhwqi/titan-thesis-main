import * as API from "../../../../../../Core/Api/Auth/User/ProductRating/ReportSpam"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import db from "../../../../Database"
import * as ProductRow from "../../../../Database/ProductRow"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import * as ProductRatingRow from "../../../../Database/ProductRatingRow"
import * as ProductRatingReportRow from "../../../../Database/ProductRatingReportRow"
import { toProductRatingReport } from "../../../../App/ProductRatingReport"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const order = await db
    .selectFrom("order_payment")
    .select(["id", "userId"])
    .where("id", "=", params.orderID.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()

  if (order == null) {
    return err("ORDER_PAYMENT_NOT_FOUND")
  }

  if (order.userId !== user.id.unwrap()) {
    return err("ORDER_NOT_OWNED_BY_USER")
  }

  const product = await ProductRow.getByID(params.productID)
  if (product == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  const orderItems = await OrderPaymentItemRow.getByOrderPaymentID(params.orderID)
  const hasProductInOrder =
    orderItems.find(
      (item) => item.productId.unwrap() === params.productID.unwrap(),
    ) != null

  if (hasProductInOrder === false) {
    return err("PRODUCT_NOT_IN_ORDER")
  }

  const rating = await ProductRatingRow.getByOrderProduct(
    params.orderID,
    params.productID,
  )

  if (rating == null) {
    return err("RATING_NOT_FOUND")
  }

  const existingReport = await ProductRatingReportRow.findByReporterOrderProduct(
    user.id,
    params.orderID,
    params.productID,
  )

  if (existingReport != null) {
    return err("RATING_REPORT_ALREADY_EXISTS")
  }

  const report = await ProductRatingReportRow.create({
    orderId: params.orderID,
    productId: params.productID,
    reporterUserId: user.id,
    reason: params.reason,
    detail: params.detail,
  })

  return ok({ report: toProductRatingReport(report) })
}
