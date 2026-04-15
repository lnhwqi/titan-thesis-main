import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import {
  ProductRatingReport,
  productRatingReportDecoder,
  ProductRatingReportReason,
  productRatingReportReasonDecoder,
  ProductRatingReportDetail,
  productRatingReportDetailDecoder,
} from "../../../../App/ProductRatingReport"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../../App/OrderPayment/OrderPaymentID"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"
import { Maybe, maybeOptionalDecoder } from "../../../../Data/Maybe"

export type Contract = AuthApi<
  AuthSeller,
  "POST",
  "/seller/product-ratings/report",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  orderID: OrderPaymentID
  productID: ProductID
  reason: ProductRatingReportReason
  detail: Maybe<ProductRatingReportDetail>
}

export type ErrorCode =
  | "ORDER_PAYMENT_NOT_FOUND"
  | "ORDER_NOT_FOR_SELLER"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_NOT_FOR_SELLER"
  | "PRODUCT_NOT_IN_ORDER"
  | "RATING_NOT_FOUND"
  | "RATING_REPORT_ALREADY_EXISTS"

export type Payload = {
  report: ProductRatingReport
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  orderID: orderPaymentIDDecoder,
  productID: productIDDecoder,
  reason: productRatingReportReasonDecoder,
  detail: maybeOptionalDecoder(productRatingReportDetailDecoder),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  report: productRatingReportDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "ORDER_PAYMENT_NOT_FOUND",
  "ORDER_NOT_FOR_SELLER",
  "PRODUCT_NOT_FOUND",
  "PRODUCT_NOT_FOR_SELLER",
  "PRODUCT_NOT_IN_ORDER",
  "RATING_NOT_FOUND",
  "RATING_REPORT_ALREADY_EXISTS",
])

export const contract: Contract = {
  method: "POST",
  route: "/seller/product-ratings/report",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
