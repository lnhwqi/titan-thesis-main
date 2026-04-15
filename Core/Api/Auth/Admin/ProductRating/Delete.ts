import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../../Data/Api"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../../App/OrderPayment/OrderPaymentID"
import { ProductID, productIDDecoder } from "../../../../App/Product/ProductID"

export type Contract = AuthApi<
  AuthAdmin,
  "DELETE",
  "/admin/product-rating/:orderID/:productID",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  orderID: OrderPaymentID
  productID: ProductID
}

export type ErrorCode =
  | "RATING_NOT_FOUND"
  | "PRODUCT_RATING_REPORT_NOT_FOUND"
  | "RATING_REPORT_NOT_APPROVED"

export type Payload = {
  orderID: OrderPaymentID
  productID: ProductID
  deleted: boolean
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  orderID: orderPaymentIDDecoder,
  productID: productIDDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  orderID: orderPaymentIDDecoder,
  productID: productIDDecoder,
  deleted: JD.boolean,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "RATING_NOT_FOUND",
  "PRODUCT_RATING_REPORT_NOT_FOUND",
  "RATING_REPORT_NOT_APPROVED",
])

export const contract: Contract = {
  method: "DELETE",
  route: "/admin/product-rating/:orderID/:productID",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
