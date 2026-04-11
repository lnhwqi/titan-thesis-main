import * as JD from "decoders"
import { Maybe, maybeDecoder } from "../Data/Maybe"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "./OrderPayment/OrderPaymentID"
import {
  OrderPaymentAddress,
  orderPaymentAddressDecoder,
} from "./OrderPayment/OrderPaymentAddress"
import {
  OrderPaymentStatus,
  orderPaymentStatusDecoder,
} from "./OrderPayment/OrderPaymentStatus"
import { Price, priceDecoder } from "./Product/Price"
import { Name, nameDecoder } from "./User/Name"
import { UserID, userIDDecoder } from "./User/UserID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import { OrderPaymentItem, orderPaymentItemDecoder } from "./OrderPaymentItem"
import {
  OrderPaymentTrackingCode,
  orderPaymentTrackingCodeDecoder,
} from "./OrderPayment/OrderPaymentTrackingCode"

export type OrderPayment = {
  id: OrderPaymentID
  userID: UserID
  sellerID: SellerID
  username: Name
  address: OrderPaymentAddress
  goodsSummary: string
  paymentMethod: "ZALOPAY" | "WALLET"
  isPaid: boolean
  items: OrderPaymentItem[]
  status: OrderPaymentStatus
  price: Price
  trackingCode: Maybe<OrderPaymentTrackingCode>
  createdAt: number
  updatedAt: number
}

export const orderPaymentDecoder: JD.Decoder<OrderPayment> = JD.object({
  id: orderPaymentIDDecoder,
  userID: userIDDecoder,
  sellerID: sellerIDDecoder,
  username: nameDecoder,
  address: orderPaymentAddressDecoder,
  goodsSummary: JD.string,
  paymentMethod: JD.oneOf(["ZALOPAY", "WALLET"]),
  isPaid: JD.boolean,
  items: JD.array(orderPaymentItemDecoder),
  status: orderPaymentStatusDecoder,
  price: priceDecoder,
  trackingCode: maybeDecoder(orderPaymentTrackingCodeDecoder),
  createdAt: JD.number,
  updatedAt: JD.number,
})
