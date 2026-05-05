import { OrderPayment } from "../../../Core/App/OrderPayment"
import { OrderPaymentItem } from "../../../Core/App/OrderPaymentItem"
import { summaryGoodsDecoder } from "../../../Core/App/OrderPayment/SummaryGoods"
import { nameDecoder as productNameDecoder } from "../../../Core/App/Product/Name"
import { productVariantNameDecoder } from "../../../Core/App/ProductVariant/ProductVariantName"
import { stockDecoder } from "../../../Core/App/ProductVariant/Stock"
import { priceDecoder } from "../../../Core/App/Product/Price"
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
  taxRate: number = 0,
): OrderPayment {
  const price = row.price.unwrap()
  const storedFee = row.fee.unwrap()
  const storedProfit = row.profit.unwrap()
  // Use frozen values if the order was already settled; otherwise estimate from current tax
  const feeAmount =
    row.isSellerSettled && (storedFee > 0 || storedProfit > 0)
      ? storedFee
      : Math.floor((price * taxRate) / 100)
  const profitAmount =
    row.isSellerSettled && (storedFee > 0 || storedProfit > 0)
      ? storedProfit
      : price - feeAmount
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
    fee: priceDecoder.verify(feeAmount),
    profit: priceDecoder.verify(profitAmount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
