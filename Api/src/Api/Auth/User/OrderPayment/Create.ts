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
import * as ConversationRow from "../../../../Database/ConversationRow"
import * as MessageRow from "../../../../Database/ConversationMessageRow"
import { createPrice } from "../../../../../../Core/App/Product/Price"
import { createOrderPaymentID } from "../../../../../../Core/App/OrderPayment/OrderPaymentID"
import { toAddressStorage } from "../../../../App/Address"
import { createNow, toDate } from "../../../../../../Core/Data/Time/Timestamp"
import { createUUID } from "../../../../../../Core/Data/UUID"
import { getSocketIO } from "../../../../Socket"

export const contract = API.contract

function toErrorMessage(value: unknown): string | null {
  if (value instanceof Error) {
    return value.message
  }

  if (
    typeof value === "object" &&
    value != null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message
  }

  return null
}

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { address, panels, isPaid, paymentMethod } = params

  if (isPaid !== (paymentMethod === "WALLET")) {
    return err("INSUFFICIENT_WALLET")
  }

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

      const created: Array<{
        row: OrderPaymentRow.OrderPaymentRow
        items: OrderPaymentItemRow.OrderPaymentItemRow[]
      }> = []

      let totalWalletCharge = 0

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

        let computedPanelPrice = 0

        for (const item of panel.items) {
          const productVariant = await trx
            .selectFrom("product_variant")
            .innerJoin("product", "product.id", "product_variant.productId")
            .select([
              "product.name as productName",
              "product.price as productPrice",
              "product_variant.price as variantPrice",
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
            const unitPrice =
              productVariant.variantPrice ?? productVariant.productPrice
            computedPanelPrice += unitPrice * item.quantity
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

        let payableValue = computedPanelPrice

        if (
          Math.round(computedPanelPrice) !== Math.round(panel.price.unwrap())
        ) {
          throw new Error("PRICE_CHANGED")
        }

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

        totalWalletCharge += payablePrice.unwrap()

        const inserted = await trx
          .insertInto("order_payment")
          .values({
            id: createOrderPaymentID().unwrap(),
            userId: user.id.unwrap(),
            sellerId: panel.sellerID.unwrap(),
            username: user.name.unwrap(),
            address: toAddressStorage(address),
            goodsSummary,
            paymentMethod,
            isPaid,
            status: "PAID",
            price: payablePrice.unwrap(),
            isSellerSettled: false,
            settledAt: null,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        const orderRow = OrderPaymentRow.orderPaymentRowDecoder.verify({
          ...inserted,
          address:
            typeof inserted.address === "string"
              ? JSON.parse(inserted.address)
              : inserted.address,
        })

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

      if (isPaid && paymentMethod === "WALLET") {
        const deductWallet = await trx
          .updateTable("user")
          .set((eb) => ({
            wallet: eb("wallet", "-", totalWalletCharge),
            updatedAt: now,
          }))
          .where("id", "=", user.id.unwrap())
          .where("isDeleted", "=", false)
          .where("wallet", ">=", totalWalletCharge)
          .executeTakeFirst()

        if (Number(deductWallet.numUpdatedRows) === 0) {
          throw new Error("INSUFFICIENT_WALLET")
        }

        const treasuryAdmin = await trx
          .selectFrom("admin")
          .select(["id"])
          .where("isDeleted", "=", false)
          .orderBy("createdAt", "asc")
          .executeTakeFirst()

        if (treasuryAdmin == null) {
          throw new Error("ADMIN_NOT_FOUND")
        }

        const creditAdmin = await trx
          .updateTable("admin")
          .set((eb) => ({
            wallet: eb("wallet", "+", totalWalletCharge),
            updatedAt: now,
          }))
          .where("id", "=", treasuryAdmin.id)
          .where("isDeleted", "=", false)
          .executeTakeFirst()

        if (Number(creditAdmin.numUpdatedRows) === 0) {
          throw new Error("ADMIN_NOT_FOUND")
        }
      }

      if (isPaid) {
        const paidItems = created.flatMap((order) => order.items)

        for (const item of paidItems) {
          if (Number.isInteger(item.quantity) === false || item.quantity <= 0) {
            throw new Error("INSUFFICIENT_STOCK")
          }

          const updated = await trx
            .updateTable("product_variant")
            .set((eb) => ({
              stock: eb("stock", "-", item.quantity),
            }))
            .where("id", "=", item.variantId.unwrap())
            .where("productId", "=", item.productId.unwrap())
            .where("stock", ">=", item.quantity)
            .executeTakeFirst()

          if (Number(updated.numUpdatedRows) === 0) {
            const variantExists = await trx
              .selectFrom("product_variant")
              .select(["id", "productId"])
              .where("id", "=", item.variantId.unwrap())
              .where("isDeleted", "=", false)
              .executeTakeFirst()

            if (
              variantExists == null ||
              variantExists.productId !== item.productId.unwrap()
            ) {
              throw new Error("VARIANT_NOT_FOUND")
            }

            throw new Error("INSUFFICIENT_STOCK")
          }
        }
      }

      if (isPaid) {
        await trx
          .deleteFrom("user_cart_item")
          .where("userId", "=", user.id.unwrap())
          .execute()
      }

      return created
    })

    try {
      await emitOrderPaymentBriefChatMessages(createdOrders)
    } catch {
      // Do not fail successful order creation when chat notification delivery fails.
    }

    return ok({
      orderPayments: createdOrders.map((order) =>
        toOrderPayment(order.row, order.items.map(toOrderPaymentItem)),
      ),
    })
  } catch (e) {
    const errorMessage = toErrorMessage(e)

    switch (errorMessage) {
      case "SELLER_NOT_FOUND":
        return err("SELLER_NOT_FOUND")
      case "ADMIN_NOT_FOUND":
        return err("ADMIN_NOT_FOUND")
      case "VARIANT_NOT_FOUND":
        return err("VARIANT_NOT_FOUND")
      case "INSUFFICIENT_STOCK":
        return err("INSUFFICIENT_STOCK")
      case "INSUFFICIENT_WALLET":
        return err("INSUFFICIENT_WALLET")
      case "PRICE_CHANGED":
        return err("PRICE_CHANGED")
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

    throw e
  }
}

async function emitOrderPaymentBriefChatMessages(
  createdOrders: Array<{
    row: OrderPaymentRow.OrderPaymentRow
    items: OrderPaymentItemRow.OrderPaymentItemRow[]
  }>,
): Promise<void> {
  const io = getSocketIO()
  const frontendURL = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "")

  for (const createdOrder of createdOrders) {
    const row = createdOrder.row
    if (!row.isPaid) {
      continue
    }

    const userID = row.userId.unwrap()
    const sellerID = row.sellerId.unwrap()

    let conversation = await ConversationRow.findBetween(userID, sellerID)
    if (conversation == null) {
      try {
        conversation = await ConversationRow.create(
          userID,
          "USER",
          sellerID,
          "SELLER",
        )
      } catch {
        conversation = await ConversationRow.findBetween(userID, sellerID)
      }
    }

    if (conversation == null) {
      continue
    }

    // Send one shared summary message visible to both parties
    const summaryText = buildOrderPaymentBriefText(row)
    const summaryMessage = await MessageRow.create({
      conversationId: conversation.id,
      senderId: "SYSTEM",
      senderType: "SYSTEM",
      senderName: "System",
      text: summaryText,
    })

    // Send buyer's tracking link
    const buyerLinkMessage = await MessageRow.create({
      conversationId: conversation.id,
      senderId: "SYSTEM",
      senderType: "SYSTEM",
      senderName: "System",
      text: `Buyer: track your order at ${frontendURL}/orders`,
    })

    // Send seller's tracking link
    const sellerLinkMessage = await MessageRow.create({
      conversationId: conversation.id,
      senderId: "SYSTEM",
      senderType: "SYSTEM",
      senderName: "System",
      text: `Seller: manage this order at ${frontendURL}/seller/orders`,
    })

    await ConversationRow.touch(conversation.id)

    if (io != null) {
      for (const msg of [summaryMessage, buyerLinkMessage, sellerLinkMessage]) {
        io.to(`conversation:${conversation.id}`).emit("message:received", {
          message: {
            id: msg.id,
            conversationID: msg.conversationId,
            senderID: msg.senderId,
            senderType: msg.senderType,
            senderName: msg.senderName,
            text: msg.text,
            readAt: msg.readAt,
            createdAt: msg.createdAt,
          },
        })
      }
      io.to(`user:${userID}`).emit("conversation:updated", {
        conversationID: conversation.id,
      })
      io.to(`user:${sellerID}`).emit("conversation:updated", {
        conversationID: conversation.id,
      })
    }
  }
}

function buildOrderPaymentBriefText(
  row: OrderPaymentRow.OrderPaymentRow,
): string {
  const orderCode = row.id.unwrap().slice(0, 8)
  const amount = row.price.unwrap()
  const goodsSummary = row.goodsSummary.trim()
  const summary =
    goodsSummary.length > 140
      ? `${goodsSummary.slice(0, 137)}...`
      : goodsSummary

  if (summary === "") {
    return `Order #${orderCode} paid successfully. Amount: T ${amount}.`
  }

  return `Order #${orderCode} paid successfully. Items: ${summary}. Amount: T ${amount}.`
}
