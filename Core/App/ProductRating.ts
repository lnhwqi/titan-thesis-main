import * as JD from "decoders"
import { Maybe, maybeOptionalDecoder } from "../Data/Maybe"
import { Text512, text512Decoder } from "../Data/Text"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "./OrderPayment/OrderPaymentID"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { Rating, ratingDecoder } from "./Product/Rating"
import { Timestamp, timestampDecoder } from "../Data/Time/Timestamp"
import { UserID, userIDDecoder } from "./User/UserID"

export type ProductRatingBlockedReason =
  | "ORDER_PAYMENT_REPORTED"
  | "RATING_WINDOW_NOT_OPEN"
  | "PRODUCT_NOT_IN_ORDER"
  | "ORDER_NOT_OWNED_BY_USER"
  | "ALREADY_RATED_PRODUCT"

export type RatingFeedback = Text512

export type ProductRating = {
  orderID: OrderPaymentID
  productID: ProductID
  userID: UserID
  score: Rating
  feedback: Maybe<RatingFeedback>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ProductRatingAvailability = {
  canRate: boolean
  availableAt: Timestamp
  blockedReason: Maybe<ProductRatingBlockedReason>
}

export const ratingFeedbackDecoder: JD.Decoder<RatingFeedback> = text512Decoder

export const productRatingBlockedReasonDecoder: JD.Decoder<ProductRatingBlockedReason> =
  JD.oneOf([
    "ORDER_PAYMENT_REPORTED",
    "RATING_WINDOW_NOT_OPEN",
    "PRODUCT_NOT_IN_ORDER",
    "ORDER_NOT_OWNED_BY_USER",
    "ALREADY_RATED_PRODUCT",
  ])

export const productRatingDecoder: JD.Decoder<ProductRating> = JD.object({
  orderID: orderPaymentIDDecoder,
  productID: productIDDecoder,
  userID: userIDDecoder,
  score: ratingDecoder,
  feedback: maybeOptionalDecoder(ratingFeedbackDecoder),
  createdAt: timestampDecoder,
  updatedAt: timestampDecoder,
})

export const productRatingAvailabilityDecoder: JD.Decoder<ProductRatingAvailability> =
  JD.object({
    canRate: JD.boolean,
    availableAt: timestampDecoder,
    blockedReason: maybeOptionalDecoder(productRatingBlockedReasonDecoder),
  })
