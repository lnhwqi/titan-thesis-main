import { OrderPayment, OrderPaymentItem } from "../../../Core/App/OrderPayment"
import { OrderPaymentRow } from "../Database/OrderPaymentRow"
import { OrderPaymentItemRow } from "../Database/OrderPaymentItemRow"

export function toOrderPaymentItem(row: OrderPaymentItemRow): OrderPaymentItem {
  return {
    productID: row.productId,
    variantID: row.variantId,
    productName: row.productName,
    variantName: row.variantName,
    quantity: row.quantity,
  }
}

export function toOrderPayment(
  row: OrderPaymentRow,
  items: OrderPaymentItem[] = [],
): OrderPayment {
  return {
    id: row.id,
    userID: row.userId,
    sellerID: row.sellerId,
    username: row.username,
    address: row.address,
    goodsSummary: row.goodsSummary,
    paymentMethod: row.paymentMethod,
    isPaid: row.isPaid,
    items,
    status: row.status,
    price: row.price,
    trackingCode: row.trackingCode,
    createdAt: row.createdAt.unwrap(),
    updatedAt: row.updatedAt.unwrap(),
  }
}
