import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/Create"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import db from "../../../../Database"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import {
  toOrderPayment,
  toOrderPaymentItem,
} from "../../../../App/OrderPayment"
import { createPrice } from "../../../../../../Core/App/Product/Price"
import { createOrderPaymentID } from "../../../../../../Core/App/OrderPayment/OrderPaymentID"
import { createNow, toDate } from "../../../../../../Core/Data/Time/Timestamp"
import { createUUID } from "../../../../../../Core/Data/UUID"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { address, panels, isPaid } = params

  if (panels.length === 0) {
    return ok({ orderPayments: [] })
  }

  const now = toDate(createNow())

  try {
    const createdOrders = await db.transaction().execute(async (trx) => {
      const lineItems = panels.flatMap((panel) => panel.items)

      if (lineItems.length === 0) {
        return []
      }

      if (isPaid) {
        for (const item of lineItems) {
          if (Number.isInteger(item.quantity) === false || item.quantity <= 0) {
            throw new Error("INSUFFICIENT_STOCK")
          }

          const updated = await trx
            .updateTable("product_variant")
            .set((eb) => ({
              stock: eb("stock", "-", item.quantity),
            }))
            .where("id", "=", item.variantID.unwrap())
            .where("productId", "=", item.productID.unwrap())
            .where("stock", ">=", item.quantity)
            .executeTakeFirst()

          if (Number(updated.numUpdatedRows) === 0) {
            const variantExists = await trx
              .selectFrom("product_variant")
              .select(["id", "productId"])
              .where("id", "=", item.variantID.unwrap())
              .where("isDeleted", "=", false)
              .executeTakeFirst()

            if (
              variantExists == null ||
              variantExists.productId !== item.productID.unwrap()
            ) {
              throw new Error("VARIANT_NOT_FOUND")
            }

            throw new Error("INSUFFICIENT_STOCK")
          }
        }
      }

      const created: Array<{
        row: OrderPaymentRow.OrderPaymentRow
        items: OrderPaymentItemRow.OrderPaymentItemRow[]
      }> = []

      for (const panel of panels) {
        const seller = await trx
          .selectFrom("seller")
          .select("id")
          .where("id", "=", panel.sellerID.unwrap())
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        if (seller == null) {
          throw new Error("SELLER_NOT_FOUND")
        }

        const goodsSummaryParts: string[] = []
        const orderItemValues: Array<{
          productID: API.PanelItem["productID"]
          variantID: API.PanelItem["variantID"]
          productName: string
          variantName: string
          quantity: number
        }> = []

        for (const item of panel.items) {
          const productVariant = await trx
            .selectFrom("product_variant")
            .innerJoin("product", "product.id", "product_variant.productId")
            .select([
              "product.name as productName",
              "product_variant.name as variantName",
            ])
            .where("product.id", "=", item.productID.unwrap())
            .where("product_variant.id", "=", item.variantID.unwrap())
            .where("product.sellerId", "=", panel.sellerID.unwrap())
            .where("product.isDeleted", "=", false)
            .where("product_variant.isDeleted", "=", false)
            .executeTakeFirst()

          if (productVariant == null) {
            throw new Error("VARIANT_NOT_FOUND")
          } else {
            goodsSummaryParts.push(
              `${productVariant.productName} (${productVariant.variantName}) x${item.quantity}`,
            )
            orderItemValues.push({
              productID: item.productID,
              variantID: item.variantID,
              productName: productVariant.productName,
              variantName: productVariant.variantName,
              quantity: item.quantity,
            })
          }
        }

        const goodsSummary = goodsSummaryParts.join(", ")

        let payableValue = panel.price.unwrap()

        if (isPaid && panel.voucherID != null) {
          const voucher = await trx
            .selectFrom("voucher")
            .innerJoin("user_voucher", "user_voucher.voucherId", "voucher.id")
            .select([
              "voucher.id as id",
              "voucher.sellerId as sellerId",
              "voucher.discount as discount",
              "voucher.minOrderValue as minOrderValue",
              "voucher.expiredDate as expiredDate",
              "user_voucher.isUsed as isUsed",
            ])
            .where("voucher.id", "=", panel.voucherID.unwrap())
            .where("voucher.isDeleted", "=", false)
            .where("voucher.active", "=", true)
            .where("user_voucher.userId", "=", user.id.unwrap())
            .forUpdate()
            .executeTakeFirst()

          if (voucher == null) {
            throw new Error("VOUCHER_NOT_FOUND")
          }

          if (voucher.sellerId !== panel.sellerID.unwrap()) {
            throw new Error("VOUCHER_NOT_FOR_SELLER")
          }

          if (voucher.isUsed) {
            throw new Error("VOUCHER_ALREADY_USED")
          }

          const expiredAt =
            voucher.expiredDate instanceof Date
              ? voucher.expiredDate.getTime()
              : new Date(voucher.expiredDate).getTime()

          if (expiredAt <= Date.now()) {
            throw new Error("VOUCHER_EXPIRED")
          }

          if (payableValue < Number(voucher.minOrderValue)) {
            throw new Error("VOUCHER_MIN_VALUE_NOT_MET")
          }

          payableValue = Math.max(0, payableValue - Number(voucher.discount))

          const markUsed = await trx
            .updateTable("user_voucher")
            .set({
              isUsed: true,
              usedAt: now,
            })
            .where("userId", "=", user.id.unwrap())
            .where("voucherId", "=", panel.voucherID.unwrap())
            .where("isUsed", "=", false)
            .executeTakeFirst()

          if (Number(markUsed.numUpdatedRows) === 0) {
            throw new Error("VOUCHER_ALREADY_USED")
          }
        }

        const payablePrice = createPrice(payableValue)
        if (payablePrice == null) {
          throw new Error("VOUCHER_MIN_VALUE_NOT_MET")
        }

        const inserted = await trx
          .insertInto("order_payment")
          .values({
            id: createOrderPaymentID().unwrap(),
            userId: user.id.unwrap(),
            sellerId: panel.sellerID.unwrap(),
            username: user.name.unwrap(),
            address: address.unwrap(),
            goodsSummary,
            isPaid,
            status: "PAID",
            price: payablePrice.unwrap(),
            trackingCode: null,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        const orderRow = OrderPaymentRow.orderPaymentRowDecoder.verify(inserted)

        const orderItems: OrderPaymentItemRow.OrderPaymentItemRow[] =
          orderItemValues.map((item) => ({
            id: createUUID().unwrap(),
            orderPaymentId: orderRow.id,
            productId: item.productID,
            variantId: item.variantID,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
          }))

        if (orderItems.length > 0) {
          await trx
            .insertInto("order_payment_item")
            .values(
              orderItems.map((item) => ({
                id: item.id,
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

        created.push({ row: orderRow, items: orderItems })
      }

      if (isPaid) {
        await trx
          .deleteFrom("user_cart_item")
          .where("userId", "=", user.id.unwrap())
          .execute()
      }

      return created
    })

    return ok({
      orderPayments: createdOrders.map((order) =>
        toOrderPayment(order.row, order.items.map(toOrderPaymentItem)),
      ),
    })
  } catch (e) {
    if (e instanceof Error) {
      switch (e.message) {
        case "SELLER_NOT_FOUND":
          return err("SELLER_NOT_FOUND")
        case "VARIANT_NOT_FOUND":
          return err("VARIANT_NOT_FOUND")
        case "INSUFFICIENT_STOCK":
          return err("INSUFFICIENT_STOCK")
        case "VOUCHER_NOT_FOUND":
          return err("VOUCHER_NOT_FOUND")
        case "VOUCHER_NOT_FOR_SELLER":
          return err("VOUCHER_NOT_FOR_SELLER")
        case "VOUCHER_EXPIRED":
          return err("VOUCHER_EXPIRED")
        case "VOUCHER_MIN_VALUE_NOT_MET":
          return err("VOUCHER_MIN_VALUE_NOT_MET")
        case "VOUCHER_ALREADY_USED":
          return err("VOUCHER_ALREADY_USED")
      }
    }

    throw e
  }
}
