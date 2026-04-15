import * as JD from "decoders"
import { Maybe, maybeOptionalDecoder } from "../Data/Maybe"
import { Text512, text512Decoder } from "../Data/Text"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "./OrderPayment/OrderPaymentID"
import { ProductID, productIDDecoder } from "./Product/ProductID"
import { Timestamp, timestampDecoder } from "../Data/Time/Timestamp"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import { Opaque, jsonValueCreate } from "../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../Data/UUID"

const reportIDKey: unique symbol = Symbol()
export type ProductRatingReportID = Opaque<string, typeof reportIDKey>

export function createProductRatingReportID(): ProductRatingReportID {
  return _createID(createUUID())
}

export const productRatingReportIDDecoder: JD.Decoder<ProductRatingReportID> =
  uuidDecoder.describe("INVALID_PRODUCT_RATING_REPORT_ID").transform(_createID)

function _createID(uuid: UUID): ProductRatingReportID {
  return jsonValueCreate<string, typeof reportIDKey>(reportIDKey)(uuid.unwrap())
}

export type ProductRatingReportReason = "SPAM"

export type ProductRatingReportStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "APPROVED_DELETE"
  | "REJECTED"

export type ProductRatingReportDetail = Text512

export type ProductRatingReport = {
  id: ProductRatingReportID
  orderID: OrderPaymentID
  productID: ProductID
  reporterSellerID: SellerID
  reason: ProductRatingReportReason
  detail: Maybe<ProductRatingReportDetail>
  status: ProductRatingReportStatus
  createdAt: Timestamp
  reviewedAt: Maybe<Timestamp>
}

export const productRatingReportReasonDecoder: JD.Decoder<ProductRatingReportReason> =
  JD.oneOf(["SPAM"])

export const productRatingReportStatusDecoder: JD.Decoder<ProductRatingReportStatus> =
  JD.oneOf(["OPEN", "UNDER_REVIEW", "APPROVED_DELETE", "REJECTED"])

export const productRatingReportDetailDecoder: JD.Decoder<ProductRatingReportDetail> =
  text512Decoder

export const productRatingReportDecoder: JD.Decoder<ProductRatingReport> =
  JD.object({
    id: productRatingReportIDDecoder,
    orderID: orderPaymentIDDecoder,
    productID: productIDDecoder,
    reporterSellerID: sellerIDDecoder,
    reason: productRatingReportReasonDecoder,
    detail: maybeOptionalDecoder(productRatingReportDetailDecoder),
    status: productRatingReportStatusDecoder,
    createdAt: timestampDecoder,
    reviewedAt: maybeOptionalDecoder(timestampDecoder),
  })
