import * as API from "../../../../../../Core/Api/Auth/User/ProductRating/Create"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import {
  ProductRatingBlockedReason,
  ProductRatingAvailability,
} from "../../../../../../Core/App/ProductRating"
import { fromDate } from "../../../../../../Core/Data/Time/Timestamp"
import { AuthUser } from "../../../AuthApi"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import * as ProductRow from "../../../../Database/ProductRow"
import * as ProductRatingRow from "../../../../Database/ProductRatingRow"
import * as MarketConfigRow from "../../../../Database/MarketConfigRow"
import db from "../../../../Database"
import { toProductRating } from "../../../../App/ProductRating"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const order = await db
    .selectFrom("order_payment")
    .select(["id", "userId", "status", "updatedAt"])
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

  if (order.status === "REPORTED") {
    return err("ORDER_PAYMENT_REPORTED")
  }

  const config = await MarketConfigRow.getOrCreate()
  const availableAt = fromDate(
    new Date(
      order.updatedAt.getTime() +
        config.reportWindowHours.unwrap() * 60 * 60 * 1000,
    ),
  )

  const availability: ProductRatingAvailability = {
    canRate: Date.now() >= availableAt.unwrap(),
    availableAt,
    blockedReason: null,
  }

  if (availability.canRate === false) {
    availability.blockedReason = "RATING_WINDOW_NOT_OPEN"
    return err("RATING_WINDOW_NOT_OPEN")
  }

  const existing = await ProductRatingRow.getByOrderProductUser(
    params.orderID,
    params.productID,
    user.id,
  )

  if (existing != null) {
    availability.blockedReason = "ALREADY_RATED_PRODUCT"
    return err("ALREADY_RATED_PRODUCT")
  }

  const created = await ProductRatingRow.create({
    orderId: params.orderID,
    productId: params.productID,
    userId: user.id,
    score: params.score,
    feedback: params.feedback,
  })

  return ok({
    rating: toProductRating(created),
    availability: {
      ...availability,
      canRate: true,
      blockedReason: null as ProductRatingBlockedReason | null,
    },
  })
}
