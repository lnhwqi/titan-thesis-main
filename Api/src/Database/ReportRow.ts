import * as JD from "decoders"
import db from "../Database"
import {
  ReportCategory,
  reportCategoryDecoder,
  ReportID,
  reportIDDecoder,
  ReportStatus,
  reportStatusDecoder,
  ReportTitle,
  reportTitleDecoder,
  ResultTextAdmin,
  resultTextAdminDecoder,
  SellerDescription,
  sellerDescriptionDecoder,
  SellerUrlImgs,
  sellerUrlImgsDecoder,
  UserDescription,
  userDescriptionDecoder,
  UserUrlImgs,
  userUrlImgsDecoder,
} from "../../../Core/App/Report"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import { SellerID, sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { Maybe, maybeDecoder } from "../../../Core/Data/Maybe"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"

const tableName = "report"

export type ReportRow = {
  id: ReportID
  sellerId: SellerID
  userId: UserID
  orderId: OrderPaymentID
  category: ReportCategory
  title: ReportTitle
  userDescription: UserDescription
  userUrlImgs: UserUrlImgs
  sellerDescription: Maybe<SellerDescription>
  sellerUrlImgs: SellerUrlImgs
  status: ReportStatus
  resultTextAdmin: Maybe<ResultTextAdmin>
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  id: ReportID
  sellerId: SellerID
  userId: UserID
  orderId: OrderPaymentID
  category: ReportCategory
  title: ReportTitle
  userDescription: UserDescription
  userUrlImgs: UserUrlImgs
  status: ReportStatus
}

export const reportRowDecoder: JD.Decoder<ReportRow> = JD.object({
  id: reportIDDecoder,
  sellerId: sellerIDDecoder,
  userId: userIDDecoder,
  orderId: orderPaymentIDDecoder,
  category: reportCategoryDecoder,
  title: reportTitleDecoder,
  userDescription: userDescriptionDecoder,
  userUrlImgs: userUrlImgsDecoder,
  sellerDescription: maybeDecoder(sellerDescriptionDecoder),
  sellerUrlImgs: sellerUrlImgsDecoder,
  status: reportStatusDecoder,
  resultTextAdmin: maybeDecoder(resultTextAdminDecoder),
  isDeleted: JD.boolean,
  updatedAt: JD.unknown.transform(timestampJSDateDecoder.verify),
  createdAt: JD.unknown.transform(timestampJSDateDecoder.verify),
})

export async function create(params: CreateParams): Promise<ReportRow> {
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      id: params.id.unwrap(),
      sellerId: params.sellerId.unwrap(),
      userId: params.userId.unwrap(),
      orderId: params.orderId.unwrap(),
      category: params.category,
      title: params.title,
      userDescription: params.userDescription.unwrap(),
      userUrlImgs: params.userUrlImgs.map((u) => u.unwrap()),
      sellerDescription: null,
      sellerUrlImgs: [],
      status: params.status,
      resultTextAdmin: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(reportRowDecoder.verify)
}

export async function getByID(id: ReportID): Promise<Maybe<ReportRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : reportRowDecoder.verify(row)))
}

export async function listByUserID(userId: UserID): Promise<ReportRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(reportRowDecoder).verify(rows))
}

export async function listBySellerID(sellerId: SellerID): Promise<ReportRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(reportRowDecoder).verify(rows))
}

export async function listAll(): Promise<ReportRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(reportRowDecoder).verify(rows))
}

export async function updateSellerResponse(
  id: ReportID,
  sellerId: SellerID,
  status: ReportStatus,
  sellerDescription: Maybe<SellerDescription>,
  sellerUrlImgs: SellerUrlImgs,
): Promise<Maybe<ReportRow>> {
  return db
    .updateTable(tableName)
    .set({
      status,
      sellerDescription: sellerDescription?.unwrap() ?? null,
      sellerUrlImgs: sellerUrlImgs.map((u) => u.unwrap()),
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row == null ? null : reportRowDecoder.verify(row)))
}

export async function updateAdminStatus(
  id: ReportID,
  status: ReportStatus,
  resultTextAdmin: Maybe<ResultTextAdmin>,
): Promise<Maybe<ReportRow>> {
  return db
    .updateTable(tableName)
    .set({
      status,
      resultTextAdmin: resultTextAdmin?.unwrap() ?? null,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row == null ? null : reportRowDecoder.verify(row)))
}
