import * as API from "../../../../../../Core/Api/Auth/Seller/ProductRating/ReportSpam"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import db from "../../../../Database"
import * as ProductRow from "../../../../Database/ProductRow"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import * as ProductRatingRow from "../../../../Database/ProductRatingRow"
import * as ProductRatingReportRow from "../../../../Database/ProductRatingReportRow"
import * as MarketConfigRow from "../../../../Database/MarketConfigRow"
import { toProductRatingReport } from "../../../../App/ProductRatingReport"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
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

  const product = await ProductRow.getByID(params.productID)
  if (product == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  if (product.sellerId.unwrap() !== seller.id.unwrap()) {
    return err("PRODUCT_NOT_FOR_SELLER")
  }

  const orderItems = await OrderPaymentItemRow.getByOrderPaymentID(
    params.orderID,
  )
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

  const existingReport =
    await ProductRatingReportRow.findByReporterOrderProduct(
      seller.id,
      params.orderID,
      params.productID,
    )

  if (existingReport != null) {
    return err("RATING_REPORT_ALREADY_EXISTS")
  }

  const config = await MarketConfigRow.getOrCreate()
  const todayCount = await ProductRatingReportRow.countTodayBySeller(seller.id)

  if (todayCount >= config.ratingReportMaxPerDay.unwrap()) {
    return err("DAILY_REPORT_LIMIT_REACHED")
  }

  const report = await ProductRatingReportRow.create({
    orderId: params.orderID,
    productId: params.productID,
    reporterSellerId: seller.id,
    reason: params.reason,
    detail: params.detail,
  })

  return ok({ report: toProductRatingReport(report) })
}
