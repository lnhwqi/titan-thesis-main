import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"

export type Contract = AuthApi<
  "POST",
  "/user/voucher/validate",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export { NoUrlParams, noUrlParamsDecoder }

export type BodyParams = {
  voucherID: VoucherID
  orderValue: number
}

export type ErrorCode =
  | "VOUCHER_NOT_FOUND"
  | "VOUCHER_NOT_IN_WALLET"
  | "VOUCHER_EXPIRED"
  | "MIN_ORDER_VALUE_NOT_MET"
  | "VOUCHER_ALREADY_USED"

export type Payload = {
  isValid: boolean
  discountAmount: number
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  isValid: JD.boolean,
  discountAmount: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
  "VOUCHER_NOT_IN_WALLET",
  "VOUCHER_EXPIRED",
  "MIN_ORDER_VALUE_NOT_MET",
  "VOUCHER_ALREADY_USED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  voucherID: voucherIDDecoder,
  orderValue: JD.number,
})

export const contract: Contract = {
  method: "POST",
  route: "/user/voucher/validate",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
