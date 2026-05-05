import * as JD from "decoders"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "./OrderPayment/OrderPaymentID"
import { Address, addressDecoder } from "./Address"
import {
  OrderPaymentStatus,
  orderPaymentStatusDecoder,
} from "./OrderPayment/OrderPaymentStatus"
import { Price, priceDecoder } from "./Product/Price"
import { Name, nameDecoder } from "./User/Name"
import { UserID, userIDDecoder } from "./User/UserID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import { OrderPaymentItem, orderPaymentItemDecoder } from "./OrderPaymentItem"
import { Timestamp, timestampDecoder } from "../Data/Time/Timestamp"
import { SummaryGoods, summaryGoodsDecoder } from "./OrderPayment/SummaryGoods"

export type OrderPayment = {
  id: OrderPaymentID
  userID: UserID
  sellerID: SellerID
  username: Name
  address: Address
  goodsSummary: SummaryGoods
  paymentMethod: "ZALOPAY" | "WALLET"
  isPaid: boolean
  items: OrderPaymentItem[]
  status: OrderPaymentStatus
  price: Price
  fee: Price
  profit: Price
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const orderPaymentDecoder: JD.Decoder<OrderPayment> = JD.object({
  id: orderPaymentIDDecoder,
  userID: userIDDecoder,
  sellerID: sellerIDDecoder,
  username: nameDecoder,
  address: addressDecoder,
  goodsSummary: summaryGoodsDecoder,
  paymentMethod: JD.oneOf(["ZALOPAY", "WALLET"]),
  isPaid: JD.boolean,
  items: JD.array(orderPaymentItemDecoder),
  status: orderPaymentStatusDecoder,
  price: priceDecoder,
  fee: priceDecoder,
  profit: priceDecoder,
  createdAt: timestampDecoder,
  updatedAt: timestampDecoder,
})
