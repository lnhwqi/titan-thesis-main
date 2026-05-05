import { randomUUID } from "node:crypto"
import * as API from "../../../../../../Core/Api/Auth/Seller/OrderPayment/UpdateTracking"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import * as ConversationRow from "../../../../Database/ConversationRow"
import * as MessageRow from "../../../../Database/ConversationMessageRow"
import {
  toOrderPayment,
  toOrderPaymentItem,
} from "../../../../App/OrderPayment"
import { getSocketIO } from "../../../../Socket"
import db from "../../../../Database"
import { createNow, toDate } from "../../../../../../Core/Data/Time/Timestamp"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id, status } = params

  if (
    status === "RECEIVED" ||
    status === "DELIVERY_ISSUE" ||
    status === "REPORTED"
  ) {
    return err("INVALID_STATUS_TRANSITION")
  }

  let row: OrderPaymentRow.OrderPaymentRow | null

  if (status === "CANCELLED") {
    row = await cancelOrderWithRefund(id, seller.id)
  } else {
    row = await OrderPaymentRow.updateTracking(id, seller.id, { status })
  }

  if (row == null) {
    return err("ORDER_PAYMENT_NOT_FOUND")
  }

  await OrderPaymentRow.autoSettleDueOrders()

  const itemRows = await OrderPaymentItemRow.getByOrderPaymentID(row.id)

  try {
    await emitOrderUpdateChatMessage(row)
  } catch {
    // Keep order status update successful even if chat notification fails.
  }

  return ok({
    orderPayment: toOrderPayment(
      row,
      itemRows.map(toOrderPaymentItem),
      seller.tax.unwrap(),
    ),
  })
}

async function cancelOrderWithRefund(
  id: OrderPaymentRow.OrderPaymentRow["id"],
  sellerId: OrderPaymentRow.OrderPaymentRow["sellerId"],
): Promise<OrderPaymentRow.OrderPaymentRow | null> {
  const now = toDate(createNow())

  return db.transaction().execute(async (trx) => {
    // Lock the order row
    const current = await trx
      .selectFrom("order_payment")
      .selectAll()
      .where("id", "=", id.unwrap())
      .where("sellerId", "=", sellerId.unwrap())
      .where("isDeleted", "=", false)
      .forUpdate()
      .executeTakeFirst()

    if (current == null) {
      return null
    }

    // Update order status to CANCELLED
    const updated = await trx
      .updateTable("order_payment")
      .set({ status: "CANCELLED", updatedAt: now })
      .where("id", "=", id.unwrap())
      .where("sellerId", "=", sellerId.unwrap())
      .where("isDeleted", "=", false)
      .returningAll()
      .executeTakeFirst()

    if (updated == null) {
      return null
    }

    // Only issue a refund if the order was actually paid
    if (current.isPaid === true) {
      const refundAmount = current.price

      // Insert audit record — UNIQUE(orderID) prevents double-refund on retry
      await trx
        .insertInto("order_cancellation_refund")
        .values({
          id: randomUUID(),
          orderID: current.id,
          userID: current.userId,
          amount: refundAmount,
          reason: "SELLER_CANCEL",
          createdAt: now,
        })
        .onConflict((oc) => oc.column("orderID").doNothing())
        .execute()

      // Credit the user's wallet
      await trx
        .updateTable("user")
        .set((eb) => ({ wallet: eb("wallet", "+", refundAmount), updatedAt: now }))
        .where("id", "=", current.userId)
        .where("isDeleted", "=", false)
        .execute()

      // Debit the treasury admin's wallet
      const treasuryAdmin = await trx
        .selectFrom("admin")
        .select(["id"])
        .where("isDeleted", "=", false)
        .orderBy("createdAt", "asc")
        .executeTakeFirst()

      if (treasuryAdmin != null) {
        await trx
          .updateTable("admin")
          .set((eb) => ({ wallet: eb("wallet", "-", refundAmount), updatedAt: now }))
          .where("id", "=", treasuryAdmin.id)
          .where("isDeleted", "=", false)
          .where("wallet", ">=", refundAmount)
          .execute()
      }
    }

    // Re-fetch to return the decoded row via existing Row decoder
    const final = await trx
      .selectFrom("order_payment")
      .selectAll()
      .where("id", "=", id.unwrap())
      .executeTakeFirst()

    if (final == null) {
      return null
    }

    // Use existing decoder path via OrderPaymentRow
    return OrderPaymentRow.decodeRaw(final)
  })
}

async function emitOrderUpdateChatMessage(
  row: OrderPaymentRow.OrderPaymentRow,
): Promise<void> {
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
    return
  }

  const message = await MessageRow.create({
    conversationId: conversation.id,
    senderId: "SYSTEM",
    senderType: "SYSTEM",
    senderName: "System",
    text: `Order #${row.id.unwrap().slice(0, 8)} updated to ${row.status}.`,
  })
  await ConversationRow.touch(conversation.id)

  const io = getSocketIO()
  if (io != null) {
    io.to(`conversation:${conversation.id}`).emit("message:received", {
      message: {
        id: message.id,
        conversationID: message.conversationId,
        senderID: message.senderId,
        senderType: message.senderType,
        senderName: message.senderName,
        text: message.text,
        readAt: message.readAt,
        createdAt: message.createdAt,
      },
    })
    io.to(`user:${userID}`).emit("conversation:updated", {
      conversationID: conversation.id,
    })
    io.to(`user:${sellerID}`).emit("conversation:updated", {
      conversationID: conversation.id,
    })
  }
}
