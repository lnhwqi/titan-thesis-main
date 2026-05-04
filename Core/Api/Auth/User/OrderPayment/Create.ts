import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { SellerID, sellerIDDecoder } from "../../../../App/Seller/SellerID"
import { OrderPayment, orderPaymentDecoder } from "../../../../App/OrderPayment"
import {
  OrderPaymentAddress,
  orderPaymentAddressDecoder,
} from "../../../../App/Address"
import { Price, priceDecoder } from "../../../../App/Product/Price"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "../../../../App/ProductVariant/ProductVariantID"
import { VoucherID, voucherIDDecoder } from "../../../../App/Voucher/VoucherID"
import { Maybe, maybeOptionalDecoder } from "../../../../Data/Maybe"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/order-payment",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  address: OrderPaymentAddress
  panels: Panel[]
  isPaid: boolean
  paymentMethod: "ZALOPAY" | "WALLET"
}

export type Panel = {
  sellerID: SellerID
  price: Price
  voucherID: Maybe<VoucherID>
  items: PanelItem[]
}

export type PanelItem = {
  productID: ProductID
  variantID: ProductVariantID
  quantity: number
}

export type ErrorCode =
  | "SELLER_NOT_FOUND"
  | "ADMIN_NOT_FOUND"
  | "VARIANT_NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "INSUFFICIENT_WALLET"
  | "PRICE_CHANGED"
  | "VOUCHER_NOT_FOUND"
  | "VOUCHER_NOT_FOR_SELLER"
  | "VOUCHER_EXPIRED"
  | "VOUCHER_MIN_VALUE_NOT_MET"
  | "VOUCHER_ALREADY_USED"

export type Payload = {
  orderPayments: OrderPayment[]
}

export const panelDecoder: JD.Decoder<Panel> = JD.object({
  sellerID: sellerIDDecoder,
  price: priceDecoder,
  voucherID: maybeOptionalDecoder(voucherIDDecoder),
  items: JD.array(
    JD.object({
      productID: productIDDecoder,
      variantID: productVariantIDDecoder,
      quantity: JD.number,
    }),
  ),
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  address: orderPaymentAddressDecoder,
  panels: JD.array(panelDecoder),
  isPaid: JD.boolean,
  paymentMethod: JD.oneOf(["ZALOPAY", "WALLET"]),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orderPayments: JD.array(orderPaymentDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SELLER_NOT_FOUND",
  "ADMIN_NOT_FOUND",
  "VARIANT_NOT_FOUND",
  "INSUFFICIENT_STOCK",
  "INSUFFICIENT_WALLET",
  "PRICE_CHANGED",
  "VOUCHER_NOT_FOUND",
  "VOUCHER_NOT_FOR_SELLER",
  "VOUCHER_EXPIRED",
  "VOUCHER_MIN_VALUE_NOT_MET",
  "VOUCHER_ALREADY_USED",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/order-payment",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
