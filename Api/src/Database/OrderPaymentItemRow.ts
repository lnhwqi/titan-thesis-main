import * as JD from "decoders"
import db from "../Database"
import { createUUID } from "../../../Core/Data/UUID"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "../../../Core/App/ProductVariant/ProductVariantID"
import { createNow, toDate } from "../../../Core/Data/Time/Timestamp"

const tableName = "order_payment_item"

export type OrderPaymentItemRow = {
  id: string
  orderPaymentId: OrderPaymentID
  productId: ProductID
  variantId: ProductVariantID
  productName: string
  variantName: string
  quantity: number
}

export type CreateParams = {
  orderPaymentId: OrderPaymentID
  productId: ProductID
  variantId: ProductVariantID
  productName: string
  variantName: string
  quantity: number
}

export const orderPaymentItemRowDecoder: JD.Decoder<OrderPaymentItemRow> =
  JD.object({
    id: JD.string,
    orderPaymentId: orderPaymentIDDecoder,
    productId: productIDDecoder,
    variantId: productVariantIDDecoder,
    productName: JD.string,
    variantName: JD.string,
    quantity: JD.number,
  })

export async function createMany(params: CreateParams[]): Promise<void> {
  if (params.length === 0) {
    return
  }

  const now = toDate(createNow())

  await db
    .insertInto(tableName)
    .values(
      params.map((item) => ({
        id: createUUID().unwrap(),
        orderPaymentId: item.orderPaymentId.unwrap(),
        productId: item.productId.unwrap(),
        variantId: item.variantId.unwrap(),
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .execute()
}

export async function getByOrderPaymentIDs(
  orderPaymentIDs: OrderPaymentID[],
): Promise<OrderPaymentItemRow[]> {
  const idStrings = orderPaymentIDs.map((id) => id.unwrap())

  if (idStrings.length === 0) {
    return []
  }

  return db
    .selectFrom(tableName)
    .selectAll()
    .where("orderPaymentId", "in", idStrings)
    .orderBy("createdAt", "asc")
    .execute()
    .then((rows) =>
      rows.map((row) =>
        orderPaymentItemRowDecoder.verify({
          id: row.id,
          orderPaymentId: row.orderPaymentId,
          productId: row.productId,
          variantId: row.variantId,
          productName: row.productName,
          variantName: row.variantName,
          quantity: Number(row.quantity),
        }),
      ),
    )
}

export async function getByOrderPaymentID(
  orderPaymentID: OrderPaymentID,
): Promise<OrderPaymentItemRow[]> {
  return getByOrderPaymentIDs([orderPaymentID])
}
