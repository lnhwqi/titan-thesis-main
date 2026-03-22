import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/MarkPaid"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import db from "../../../../Database"
import { createNow, toDate } from "../../../../../../Core/Data/Time/Timestamp"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { orderPaymentIDs, panels } = params

  if (orderPaymentIDs.length === 0 || panels.length === 0) {
    return err("INVALID_ORDER_IDS")
  }

  const targetOrderPaymentIDs = Array.from(
    new Set(orderPaymentIDs.map((id) => id.trim()).filter((id) => id !== "")),
  )

  if (targetOrderPaymentIDs.length === 0) {
    return err("INVALID_ORDER_IDS")
  }

  const now = toDate(createNow())

  const updatedCount = await db.transaction().execute(async (trx) => {
    const unpaidTargets = await trx
      .selectFrom("order_payment")
      .select((eb) => eb.fn.count("id").as("count"))
      .where("userId", "=", user.id.unwrap())
      .where("isDeleted", "=", false)
      .where("isPaid", "=", false)
      .where("id", "in", targetOrderPaymentIDs)
      .executeTakeFirstOrThrow()

    if (Number(unpaidTargets.count) !== targetOrderPaymentIDs.length) {
      throw new Error("INVALID_ORDER_IDS")
    }

    const lineItems = panels.flatMap((panel) => panel.items)

    for (const item of lineItems) {
      if (Number.isInteger(item.quantity) === false || item.quantity <= 0) {
        throw new Error("INVALID_ORDER_IDS")
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
        throw new Error("INVALID_ORDER_IDS")
      }
    }

    for (const panel of panels) {
      let payableValue = panel.price.unwrap()

      if (panel.voucherID != null) {
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

        if (voucher == null || voucher.sellerId !== panel.sellerID.unwrap()) {
          throw new Error("INVALID_ORDER_IDS")
        }

        if (voucher.isUsed) {
          throw new Error("INVALID_ORDER_IDS")
        }

        const expiredAt =
          voucher.expiredDate instanceof Date
            ? voucher.expiredDate.getTime()
            : new Date(voucher.expiredDate).getTime()

        if (expiredAt <= Date.now()) {
          throw new Error("INVALID_ORDER_IDS")
        }

        if (payableValue < Number(voucher.minOrderValue)) {
          throw new Error("INVALID_ORDER_IDS")
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
          throw new Error("INVALID_ORDER_IDS")
        }
      }

      const markPaid = await trx
        .updateTable("order_payment")
        .set({
          isPaid: true,
          price: payableValue,
          updatedAt: now,
        })
        .where("userId", "=", user.id.unwrap())
        .where("sellerId", "=", panel.sellerID.unwrap())
        .where("isDeleted", "=", false)
        .where("isPaid", "=", false)
        .where("id", "in", targetOrderPaymentIDs)
        .executeTakeFirst()

      if (Number(markPaid.numUpdatedRows) === 0) {
        throw new Error("INVALID_ORDER_IDS")
      }
    }

    await trx
      .deleteFrom("user_cart_item")
      .where("userId", "=", user.id.unwrap())
      .execute()

    const result = await trx
      .selectFrom("order_payment")
      .select((eb) => eb.fn.count("id").as("count"))
      .where("userId", "=", user.id.unwrap())
      .where("isDeleted", "=", false)
      .where("isPaid", "=", true)
      .where("id", "in", targetOrderPaymentIDs)
      .executeTakeFirstOrThrow()

    const paidCount = Number(result.count)
    if (paidCount !== targetOrderPaymentIDs.length) {
      throw new Error("INVALID_ORDER_IDS")
    }

    return paidCount
  })

  return ok({ updatedCount })
}
