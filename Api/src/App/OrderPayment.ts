import { OrderPayment } from "../../../Core/App/OrderPayment"
import { OrderPaymentRow } from "../Database/OrderPaymentRow"

export function toOrderPayment(row: OrderPaymentRow): OrderPayment {
  return {
    id: row.id,
    userID: row.userId,
    sellerID: row.sellerId,
    username: row.username,
    address: row.address,
    status: row.status,
    price: row.price,
    trackingCode: row.trackingCode,
    createdAt: row.createdAt.unwrap(),
    updatedAt: row.updatedAt.unwrap(),
  }
}
