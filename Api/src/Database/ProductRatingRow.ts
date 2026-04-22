import * as JD from "decoders"
import db from "../Database"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import { Rating, ratingDecoder } from "../../../Core/App/Product/Rating"
import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { Maybe, maybeDecoder } from "../../../Core/Data/Maybe"
import { Text512, text512Decoder } from "../../../Core/Data/Text"
import {
  createNow,
  Timestamp,
  timestampJSDateDecoder,
  toDate,
} from "../../../Core/Data/Time/Timestamp"

const tableName = "product_rating"

export type ProductRatingRow = {
  orderId: OrderPaymentID
  productId: ProductID
  userId: UserID
  score: Rating
  feedback: Maybe<Text512>
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  orderId: OrderPaymentID
  productId: ProductID
  userId: UserID
  score: Rating
  feedback: Maybe<Text512>
}

export const productRatingRowDecoder: JD.Decoder<ProductRatingRow> = JD.object({
  orderId: orderPaymentIDDecoder,
  productId: productIDDecoder,
  userId: userIDDecoder,
  score: ratingDecoder,
  feedback: maybeDecoder(text512Decoder),
  isDeleted: JD.boolean,
  updatedAt: JD.unknown.transform(timestampJSDateDecoder.verify),
  createdAt: JD.unknown.transform(timestampJSDateDecoder.verify),
})

export async function create(params: CreateParams): Promise<ProductRatingRow> {
  const now = toDate(createNow())

  return db
    .insertInto(tableName)
    .values({
      orderId: params.orderId.unwrap(),
      productId: params.productId.unwrap(),
      userId: params.userId.unwrap(),
      score: params.score.unwrap(),
      feedback: params.feedback?.unwrap() ?? null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then(productRatingRowDecoder.verify)
}

export async function getByOrderProductUser(
  orderId: OrderPaymentID,
  productId: ProductID,
  userId: UserID,
): Promise<Maybe<ProductRatingRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("orderId", "=", orderId.unwrap())
    .where("productId", "=", productId.unwrap())
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : productRatingRowDecoder.verify(row)))
}

export async function getByOrderProduct(
  orderId: OrderPaymentID,
  productId: ProductID,
): Promise<Maybe<ProductRatingRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("orderId", "=", orderId.unwrap())
    .where("productId", "=", productId.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()
    .then((row) => (row == null ? null : productRatingRowDecoder.verify(row)))
}

export async function softDeleteByOrderProduct(
  orderId: OrderPaymentID,
  productId: ProductID,
): Promise<Maybe<ProductRatingRow>> {
  return db
    .updateTable(tableName)
    .set({
      isDeleted: true,
      updatedAt: toDate(createNow()),
    })
    .where("orderId", "=", orderId.unwrap())
    .where("productId", "=", productId.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) => (row == null ? null : productRatingRowDecoder.verify(row)))
}

export async function getByProductId(
  productId: ProductID,
): Promise<ProductRatingRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("productId", "=", productId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(productRatingRowDecoder).verify(rows))
}

export async function getByUserID(userId: UserID): Promise<ProductRatingRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) => JD.array(productRatingRowDecoder).verify(rows))
}
