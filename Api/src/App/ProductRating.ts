import { ProductRating } from "../../../Core/App/ProductRating"
import { toMillisecond } from "../../../Core/Data/Time/Timestamp"
import { ProductRatingRow } from "../Database/ProductRatingRow"

export function toProductRating(row: ProductRatingRow): ProductRating {
  return {
    orderID: row.orderId,
    productID: row.productId,
    userID: row.userId,
    score: row.score,
    feedback: row.feedback,
    createdAt: toMillisecond(row.createdAt),
    updatedAt: toMillisecond(row.updatedAt),
  }
}
