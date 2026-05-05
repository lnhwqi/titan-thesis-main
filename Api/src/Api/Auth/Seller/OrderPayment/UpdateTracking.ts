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

  const row = await OrderPaymentRow.updateTracking(id, seller.id, {
    status,
  })

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
