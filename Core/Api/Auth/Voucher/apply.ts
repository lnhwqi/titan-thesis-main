import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"
export { NoUrlParams, noUrlParamsDecoder }
export type Contract = AuthApi<
  "POST",
  "/user/voucher/apply",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  voucherID: VoucherID
  orderValue: number
}

export type ErrorCode =
  | "VOUCHER_NOT_FOUND"
  | "VOUCHER_NOT_IN_WALLET"
  | "VOUCHER_ALREADY_USED"
  | "VOUCHER_EXPIRED"
  | "MIN_ORDER_VALUE_NOT_MET"

export type Payload = {
  success: boolean
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  success: JD.boolean,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
  "VOUCHER_NOT_IN_WALLET",
  "VOUCHER_ALREADY_USED",
  "VOUCHER_EXPIRED",
  "MIN_ORDER_VALUE_NOT_MET",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  voucherID: voucherIDDecoder,
  orderValue: JD.number,
})

export const contract: Contract = {
  method: "POST",
  route: "/user/voucher/apply",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
