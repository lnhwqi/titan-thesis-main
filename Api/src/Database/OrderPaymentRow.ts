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
} from "../../../Core/App/Address"
import { toAddressStorage } from "../App/Address"
import {
  OrderPaymentStatus,
  orderPaymentStatusDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentStatus"
import { Price, priceDecoder } from "../../../Core/App/Product/Price"
import { Maybe, maybeDecoder } from "../../../Core/Data/Maybe"
import * as MarketConfigRow from "./MarketConfigRow"

function parseJsonSafe(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return {
      provinceCode: "0",
      provinceName: value || "Unknown",
      districtCode: "0",
      districtName: "Unknown",
      wardCode: "0",
      wardName: "Unknown",
      detail: value || "Unknown",
    }
  }
}

const tableName = "order_payment"

export type OrderPaymentRow = {
  id: OrderPaymentID
  userId: UserID
  sellerId: SellerID
  username: Name
  address: OrderPaymentAddress
  goodsSummary: string
  paymentMethod: "ZALOPAY" | "WALLET"
  isPaid: boolean
  status: OrderPaymentStatus
  price: Price
  fee: Price
  profit: Price
  isSellerSettled: boolean
  settledAt: Maybe<Timestamp>
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
}

export const orderPaymentRowDecoder: JD.Decoder<OrderPaymentRow> = JD.object({
  id: orderPaymentIDDecoder,
  userId: userIDDecoder,
  sellerId: sellerIDDecoder,
  username: nameDecoder,
  address: orderPaymentAddressDecoder,
  goodsSummary: JD.string,
  paymentMethod: JD.oneOf(["ZALOPAY", "WALLET"]),
  isPaid: JD.boolean,
  status: orderPaymentStatusDecoder,
  price: priceDecoder,
  fee: priceDecoder,
  profit: priceDecoder,
  isSellerSettled: JD.boolean,
  settledAt: maybeDecoder(timestampJSDateDecoder),
  isDeleted: JD.boolean,
  updatedAt: JD.unknown.transform(timestampJSDateDecoder.verify),
  createdAt: JD.unknown.transform(timestampJSDateDecoder.verify),
})

function normalizeOrderPaymentRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...row,
    address:
      typeof row.address === "string"
        ? parseJsonSafe(row.address)
        : row.address,
    goodsSummary: typeof row.goodsSummary === "string" ? row.goodsSummary : "",
    paymentMethod: row.paymentMethod === "WALLET" ? "WALLET" : "ZALOPAY",
  }
}

export function decodeRaw(row: Record<string, unknown>): OrderPaymentRow {
  return orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row))
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
      address: toAddressStorage(params.address),
      goodsSummary: "",
      paymentMethod: "ZALOPAY",
      isPaid: true,
      status: "PAID",
      price: params.price.unwrap(),
      fee: 0,
      profit: 0,
      isSellerSettled: false,
      settledAt: null,
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

export async function updateStatusByReportFlow(
  id: OrderPaymentID,
  nextStatus: OrderPaymentStatus,
): Promise<Maybe<OrderPaymentRow>> {
  return db
    .updateTable(tableName)
    .set({
      status: nextStatus,
      updatedAt: toDate(createNow()),
    })
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
    .returningAll()
    .executeTakeFirst()
    .then((row) =>
      row == null
        ? null
        : orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
    )
}

export async function getByID(
  id: OrderPaymentID,
): Promise<Maybe<OrderPaymentRow>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("id", "=", id.unwrap())
    .where("isDeleted", "=", false)
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

export async function getUserTotals(
  userId: UserID,
): Promise<{ totalMoneyPaid: number; totalProducts: number }> {
  const moneyResult = await db
    .selectFrom(tableName)
    .select((eb) => eb.fn.sum<number>("price").as("totalMoneyPaid"))
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()

  const orderIDs = await db
    .selectFrom(tableName)
    .select("id")
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => rows.map((r) => r.id))

  let totalProducts = 0
  if (orderIDs.length > 0) {
    const productsResult = await db
      .selectFrom("order_payment_item")
      .select((eb) => eb.fn.sum<number>("quantity").as("totalProducts"))
      .where("orderPaymentId", "in", orderIDs)
      .executeTakeFirst()
    totalProducts = Number(productsResult?.totalProducts ?? 0)
  }

  return {
    totalMoneyPaid: Number(moneyResult?.totalMoneyPaid ?? 0),
    totalProducts,
  }
}

export async function getByUserIDPaginated(
  userId: UserID,
  limit: number,
  offset: number,
): Promise<{ rows: OrderPaymentRow[]; totalCount: number }> {
  const countResult = await db
    .selectFrom(tableName)
    .select((eb) => eb.fn.count<number>("id").as("count"))
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .executeTakeFirst()

  const totalCount = Number(countResult?.count ?? 0)

  const rows = await db
    .selectFrom(tableName)
    .selectAll()
    .where("userId", "=", userId.unwrap())
    .where("isDeleted", "=", false)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .offset(offset)
    .execute()
    .then((rows) =>
      rows.map((row) =>
        orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
      ),
    )

  return { rows, totalCount }
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

export async function hasPaidOrderBetween(
  userId: string,
  sellerId: string,
): Promise<boolean> {
  const row = await db
    .selectFrom(tableName)
    .select("id")
    .where("userId", "=", userId)
    .where("sellerId", "=", sellerId)
    .where("isDeleted", "=", false)
    .where("isPaid", "=", true)
    .executeTakeFirst()

  return row != null
}

export async function getPaidConversationPairsForParticipant(
  participantId: string,
  participantType: "USER" | "SELLER",
): Promise<Array<{ userId: string; sellerId: string }>> {
  const rows = await db
    .selectFrom(tableName)
    .select(["userId", "sellerId"])
    .where("isDeleted", "=", false)
    .where("isPaid", "=", true)
    .where(
      participantType === "USER" ? "userId" : "sellerId",
      "=",
      participantId,
    )
    .distinct()
    .execute()

  return rows.map((row) => ({
    userId: row.userId,
    sellerId: row.sellerId,
  }))
}

export async function getAllPaid(): Promise<OrderPaymentRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("isDeleted", "=", false)
    .where("isPaid", "=", true)
    .orderBy("createdAt", "desc")
    .execute()
    .then((rows) =>
      rows.map((row) =>
        orderPaymentRowDecoder.verify(normalizeOrderPaymentRow(row)),
      ),
    )
}

export async function autoSettleDueOrders(): Promise<number> {
  const config = await MarketConfigRow.getOrCreate()
  const now = new Date()
  const cutoff = new Date(
    now.getTime() - config.reportWindowHours.unwrap() * 60 * 60 * 1000,
  )
  // const cutoff = new Date(now.getTime() - 0)

  return db.transaction().execute(async (trx) => {
    const candidates = await trx
      .selectFrom("order_payment")
      .leftJoin("report", (join) =>
        join
          .onRef("report.orderId", "=", "order_payment.id")
          .on("report.isDeleted", "=", false),
      )
      .innerJoin("seller", "seller.id", "order_payment.sellerId")
      .select([
        "order_payment.id as orderID",
        "order_payment.sellerId as sellerID",
        "order_payment.price as orderPrice",
        "seller.tax as sellerTax",
      ])
      .where("order_payment.isDeleted", "=", false)
      .where("order_payment.isPaid", "=", true)
      .where("order_payment.isSellerSettled", "=", false)
      .where("order_payment.status", "in", ["DELIVERED", "RECEIVED"])
      .where("order_payment.updatedAt", "<=", cutoff)
      .where("seller.isDeleted", "=", false)
      .where("report.id", "is", null)
      .execute()

    let settledCount = 0

    for (const candidate of candidates) {
      const tax = Math.max(0, Math.min(100, Number(candidate.sellerTax)))
      const gross = Number(candidate.orderPrice)
      const payout = Math.floor((gross * (100 - tax)) / 100)

      const orderClaimed = await trx
        .updateTable("order_payment")
        .set({
          isSellerSettled: true,
          settledAt: now,
          fee: gross - payout,
          profit: payout,
          updatedAt: now,
        })
        .where("id", "=", candidate.orderID)
        .where("isSellerSettled", "=", false)
        .where("isDeleted", "=", false)
        .executeTakeFirst()

      if (Number(orderClaimed.numUpdatedRows) === 0) {
        continue
      }

      const admin = await trx
        .selectFrom("admin")
        .select(["id"])
        .where("isDeleted", "=", false)
        .orderBy("createdAt", "asc")
        .executeTakeFirst()

      if (admin == null) {
        await trx
          .updateTable("order_payment")
          .set({
            isSellerSettled: false,
            settledAt: null,
            updatedAt: now,
          })
          .where("id", "=", candidate.orderID)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        continue
      }

      const adminDebited = await trx
        .updateTable("admin")
        .set((eb) => ({
          wallet: eb("wallet", "-", payout),
          updatedAt: now,
        }))
        .where("id", "=", admin.id)
        .where("wallet", ">=", payout)
        .where("isDeleted", "=", false)
        .executeTakeFirst()

      if (Number(adminDebited.numUpdatedRows) === 0) {
        await trx
          .updateTable("order_payment")
          .set({
            isSellerSettled: false,
            settledAt: null,
            updatedAt: now,
          })
          .where("id", "=", candidate.orderID)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        continue
      }

      const sellerCredited = await trx
        .updateTable("seller")
        .set((eb) => ({
          wallet: eb("wallet", "+", payout),
          revenue: eb("revenue", "+", gross),
          profit: eb("profit", "+", payout),
          updatedAt: now,
        }))
        .where("id", "=", candidate.sellerID)
        .where("isDeleted", "=", false)
        .executeTakeFirst()

      if (Number(sellerCredited.numUpdatedRows) === 0) {
        await trx
          .updateTable("admin")
          .set((eb) => ({
            wallet: eb("wallet", "+", payout),
            updatedAt: now,
          }))
          .where("id", "=", admin.id)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        await trx
          .updateTable("order_payment")
          .set({
            isSellerSettled: false,
            settledAt: null,
            updatedAt: now,
          })
          .where("id", "=", candidate.orderID)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        continue
      }

      const orderSettled = await trx
        .updateTable("order_payment")
        .set({
          status: "RECEIVED",
          updatedAt: now,
        })
        .where("id", "=", candidate.orderID)
        .where("isDeleted", "=", false)
        .executeTakeFirst()

      if (Number(orderSettled.numUpdatedRows) === 0) {
        await trx
          .updateTable("seller")
          .set((eb) => ({
            wallet: eb("wallet", "-", payout),
            revenue: eb("revenue", "-", gross),
            profit: eb("profit", "-", payout),
            updatedAt: now,
          }))
          .where("id", "=", candidate.sellerID)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        await trx
          .updateTable("admin")
          .set((eb) => ({
            wallet: eb("wallet", "+", payout),
            updatedAt: now,
          }))
          .where("id", "=", admin.id)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        await trx
          .updateTable("order_payment")
          .set({
            isSellerSettled: false,
            settledAt: null,
            updatedAt: now,
          })
          .where("id", "=", candidate.orderID)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        continue
      }

      settledCount += 1
    }

    return settledCount
  })
}
