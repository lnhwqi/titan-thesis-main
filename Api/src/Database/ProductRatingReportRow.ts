import * as JD from "decoders"
import db from "../Database"
import {
  createProductRatingReportID,
  ProductRatingReportID,
  productRatingReportIDDecoder,
  ProductRatingReportReason,
  productRatingReportReasonDecoder,
  ProductRatingReportStatus,
  productRatingReportStatusDecoder,
} from "../../../Core/App/ProductRatingReport"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import { ProductID, productIDDecoder } from "../../../Core/App/Product/ProductID"
import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { Maybe, maybeDecoder } from "../../../Core/Data/Maybe"
import { Text512, text512Decoder } from "../../../Core/Data/Text"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"

const tableName = "product_rating_report"

export type ProductRatingReportRow = {
  id: ProductRatingReportID
  orderId: OrderPaymentID
  productId: ProductID
  reporterUserId: UserID
  reason: ProductRatingReportReason
  detail: Maybe<Text512>
  status: ProductRatingReportStatus
  reviewedAt: Maybe<Timestamp>
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  orderId: OrderPaymentID
  productId: ProductID
  reporterUserId: UserID
  reason: ProductRatingReportReason
  detail: Maybe<Text512>
}

export const productRatingReportRowDecoder: JD.Decoder<ProductRatingReportRow> =
  JD.object({
    id: productRatingReportIDDecoder,
    orderId: orderPaymentIDDecoder,
    productId: productIDDecoder,
    reporterUserId: userIDDecoder,
    reason: productRatingReportReasonDecoder,
    detail: maybeDecoder(text512Decoder),
    status: productRatingReportStatusDecoder,
    reviewedAt: maybeDecoder(timestampJSDateDecoder),
    isDeleted: JD.boolean,
    updatedAt: JD.unknown.transform(timestampJSDateDecoder.verify),
    createdAt: JD.unknown.transform(timestampJSDateDecoder.verify),
  })

export async function create(
  params: CreateParams,
): Promise<ProductRatingReportRow> {
  const now = toDate(createNow())
  const id = createProductRatingReportID()

  return db
    .insertInto(tableName)
    .values({
      id: id.unwrap(),
      orderId: params.orderId.unwrap(),
      productId: params.productId.unwrap(),
      reporterUserId: params.reporterUserId.unwrap(),
      reason: params.reason,
      detail: params.detail?.unwrap() ?? null,
      status: "OPEN",
      reviewedAt: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productRatingReportRowDecoder.verify)
}

export async function getByID(
  id: ProductRatingReportID,
): Promise<Maybe<ProductRatingReportRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) =>
      row == null ? null : productRatingReportRowDecoder.verify(row),
    )
}

export async function findByReporterOrderProduct(
  reporterUserId: UserID,
  orderId: OrderPaymentID,
  productId: ProductID,
): Promise<Maybe<ProductRatingReportRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("reporterUserId", "=", reporterUserId.unwrap())
    .where("orderId", "=", orderId.unwrap())
    .where("productId", "=", productId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .executeTakeFirst()
    .then((row) =>
      row == null ? null : productRatingReportRowDecoder.verify(row),
    )
}

export async function findLatestByOrderProduct(
  orderId: OrderPaymentID,
  productId: ProductID,
): Promise<Maybe<ProductRatingReportRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("orderId", "=", orderId.unwrap())
    .where("productId", "=", productId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .executeTakeFirst()
    .then((row) =>
      row == null ? null : productRatingReportRowDecoder.verify(row),
    )
}

export async function updateStatus(
  id: ProductRatingReportID,
  status: Exclude<ProductRatingReportStatus, "OPEN">,
): Promise<Maybe<ProductRatingReportRow>> {
  return db
    .updateTable(tableName)
    .set({
      status,
      reviewedAt: toDate(createNow()),
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) =>
      row == null ? null : productRatingReportRowDecoder.verify(row),
    )
}
