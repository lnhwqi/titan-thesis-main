import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import {
  ProductRating,
  productRatingDecoder,
  RatingFeedback,
  ratingFeedbackDecoder,
  ProductRatingAvailability,
  productRatingAvailabilityDecoder,
} from "../../../../App/ProductRating"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../../App/OrderPayment/OrderPaymentID"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"
import { Rating, ratingDecoder } from "../../../../App/Product/Rating"
import { Maybe, maybeOptionalDecoder } from "../../../../Data/Maybe"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/product-ratings",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  orderID: OrderPaymentID
  productID: ProductID
  score: Rating
  feedback: Maybe<RatingFeedback>
}

export type ErrorCode =
  | "ORDER_PAYMENT_NOT_FOUND"
  | "ORDER_NOT_OWNED_BY_USER"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_NOT_IN_ORDER"
  | "ORDER_PAYMENT_REPORTED"
  | "RATING_WINDOW_NOT_OPEN"
  | "ALREADY_RATED_PRODUCT"

export type Payload = {
  rating: ProductRating
  availability: ProductRatingAvailability
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  orderID: orderPaymentIDDecoder,
  productID: productIDDecoder,
  score: ratingDecoder,
  feedback: maybeOptionalDecoder(ratingFeedbackDecoder),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  rating: productRatingDecoder,
  availability: productRatingAvailabilityDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "ORDER_PAYMENT_NOT_FOUND",
  "ORDER_NOT_OWNED_BY_USER",
  "PRODUCT_NOT_FOUND",
  "PRODUCT_NOT_IN_ORDER",
  "ORDER_PAYMENT_REPORTED",
  "RATING_WINDOW_NOT_OPEN",
  "ALREADY_RATED_PRODUCT",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/product-ratings",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
