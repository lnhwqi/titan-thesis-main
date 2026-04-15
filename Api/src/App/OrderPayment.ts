import { OrderPayment } from "../../../Core/App/OrderPayment"
import { OrderPaymentItem } from "../../../Core/App/OrderPaymentItem"
import { summaryGoodsDecoder } from "../../../Core/App/OrderPayment/SummaryGoods"
import { nameDecoder as productNameDecoder } from "../../../Core/App/Product/Name"
import { productVariantNameDecoder } from "../../../Core/App/ProductVariant/ProductVariantName"
import { stockDecoder } from "../../../Core/App/ProductVariant/Stock"
import { OrderPaymentRow } from "../Database/OrderPaymentRow"
import { OrderPaymentItemRow } from "../Database/OrderPaymentItemRow"

export function toOrderPaymentItem(row: OrderPaymentItemRow): OrderPaymentItem {
  return {
    productID: row.productId,
    variantID: row.variantId,
    productName: productNameDecoder.verify(row.productName),
    variantName: productVariantNameDecoder.verify(row.variantName),
    quantity: stockDecoder.verify(row.quantity),
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
    goodsSummary: summaryGoodsDecoder.verify(
      row.goodsSummary === "" ? "No goods info" : row.goodsSummary,
    ),
    paymentMethod: row.paymentMethod,
    isPaid: row.isPaid,
    items,
    status: row.status,
    price: row.price,
    trackingCode: row.trackingCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
