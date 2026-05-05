import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import {
  Report,
  reportDecoder,
  ReportCategory,
  reportCategoryDecoder,
  ReportTitle,
  reportTitleDecoder,
  UserDescription,
  userDescriptionDecoder,
  UserUrlImgs,
  userUrlImgsDecoder,
  isReportTitleMatchingCategory,
} from "../../../../App/Report"
import { SellerID, sellerIDDecoder } from "../../../../App/Seller/SellerID"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../../App/OrderPayment/OrderPaymentID"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/reports",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  sellerID: SellerID
  orderID: OrderPaymentID
  category: ReportCategory
  title: ReportTitle
  userDescription: UserDescription
  userUrlImgs: UserUrlImgs
}

export type ErrorCode =
  | "ORDER_PAYMENT_NOT_FOUND"
  | "SELLER_NOT_FOUND"
  | "ORDER_NOT_OWNED_BY_USER"
  | "ORDER_NOT_REPORTABLE"
  | "REPORT_WINDOW_EXPIRED"
  | "REPORT_TITLE_MISMATCH"

export type Payload = {
  report: Report
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  sellerID: sellerIDDecoder,
  orderID: orderPaymentIDDecoder,
  category: reportCategoryDecoder,
  title: reportTitleDecoder,
  userDescription: userDescriptionDecoder,
  userUrlImgs: userUrlImgsDecoder,
}).transform((body) => {
  if (isReportTitleMatchingCategory(body.category, body.title) === false) {
    throw new Error("REPORT_TITLE_MISMATCH")
  }

  return body
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  report: reportDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "ORDER_PAYMENT_NOT_FOUND",
  "SELLER_NOT_FOUND",
  "ORDER_NOT_OWNED_BY_USER",
  "ORDER_NOT_REPORTABLE",
  "REPORT_WINDOW_EXPIRED",
  "REPORT_TITLE_MISMATCH",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/reports",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
