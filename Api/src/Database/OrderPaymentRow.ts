import * as JD from "decoders"
import db from "../Database"
import {
  createNow,
  timestampJSDateDecoder,
  Timestamp,
  toDate,
} from "../../../Core/Data/Time/Timestamp"
import {
  OrderPaymentID,
  createOrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { SellerID, sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import { Name, nameDecoder } from "../../../Core/App/User/Name"
import {
  OrderPaymentAddress,
  orderPaymentAddressDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentAddress"
import {
  OrderPaymentStatus,
  orderPaymentStatusDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentStatus"
import { Price, priceDecoder } from "../../../Core/App/Product/Price"
import { Maybe, maybeDecoder } from "../../../Core/Data/Maybe"
import {
  OrderPaymentTrackingCode,
  orderPaymentTrackingCodeDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentTrackingCode"

const tableName = "order_payment"

export type OrderPaymentRow = {
  id: OrderPaymentID
  userId: UserID
  sellerId: SellerID
  username: Name
  address: OrderPaymentAddress
  goodsSummary: string
  isPaid: boolean
  status: OrderPaymentStatus
  price: Price
  trackingCode: Maybe<OrderPaymentTrackingCode>
  isDeleted: boolean
  updatedAt: Timestamp
  createdAt: Timestamp
}

export type CreateParams = {
  userId: UserID
  sellerId: SellerID
  username: Name
  address: OrderPaymentAddress
  price: Price
}

export type UpdateTrackingParams = {
  status: OrderPaymentStatus
  trackingCode: Maybe<OrderPaymentTrackingCode>
}

export const orderPaymentRowDecoder: JD.Decoder<OrderPaymentRow> = JD.object({
  id: orderPaymentIDDecoder,
  userId: userIDDecoder,
  sellerId: sellerIDDecoder,
  username: nameDecoder,
  address: orderPaymentAddressDecoder,
  goodsSummary: JD.string,
  isPaid: JD.boolean,
  status: orderPaymentStatusDecoder,
  price: priceDecoder,
  trackingCode: maybeDecoder(orderPaymentTrackingCodeDecoder),
  isDeleted: JD.boolean,
  updatedAt: JD.unknown.transform(timestampJSDateDecoder.verify),
  createdAt: JD.unknown.transform(timestampJSDateDecoder.verify),
})

function normalizeOrderPaymentRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...row,
    goodsSummary: typeof row.goodsSummary === "string" ? row.goodsSummary : "",
  }
}

export async function create(params: CreateParams): Promise<OrderPaymentRow> {
  const now = toDate(createNow())
  const id = createOrderPaymentID()

  return db
    .insertInto(tableName)
    .values({
      id: id.unwrap(),
      userId: params.userId.unwrap(),
      sellerId: params.sellerId.unwrap(),
      username: params.username.unwrap(),
      address: params.address.unwrap(),
      goodsSummary: "",
      isPaid: true,
      status: "PAID",
      price: params.price.unwrap(),
      trackingCode: null,
      isDeleted: false,
      updatedAt: now,
      createdAt: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .then((row) => orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)))
}

export async function updateTracking(
  id: OrderPaymentID,
  sellerId: SellerID,
  params: UpdateTrackingParams,
): Promise<Maybe<OrderPaymentRow>> {
  return db
    .updateTable(tableName)
    .set({
      status: params.status,
      trackingCode: params.trackingCode?.unwrap() ?? null,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) =>
      row == null
        ? null
        : orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
    )
}

export async function markAsPaidByIDs(
  userId: UserID,
  ids: OrderPaymentID[],
): Promise<number> {
  if (ids.length === 0) {
    return 0
  }

  const result = await db
    .updateTable(tableName)
    .set({
      isPaid: true,
      updatedAt: toDate(createNow()),
    })
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .where("isPaid", "=", false)
    .where(
      "id",
      "in",
      ids.map((id) => id.unwrap()),
    )
    .executeTakeFirst()

  return Number(result.numUpdatedRows)
}

export async function updateStatusByUser(
  id: OrderPaymentID,
  userId: UserID,
  nextStatus: OrderPaymentStatus,
): Promise<Maybe<OrderPaymentRow>> {
  return db
    .updateTable(tableName)
    .set({
      status: nextStatus,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .where("status", "=", "DELIVERED")
    .returningAll()
    .executeTakeFirst()
    .then((row) =>
      row == null
        ? null
        : orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
    )
}

export async function getByUserID(userId: UserID): Promise<OrderPaymentRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) =>
      rows.map((row) =>
        orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
      ),
    )
}

export async function getBySellerID(
  sellerId: SellerID,
): Promise<OrderPaymentRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("sellerId", "=", sellerId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) =>
      rows.map((row) =>
        orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
      ),
    )
}
