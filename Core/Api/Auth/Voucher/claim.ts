import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"

export { NoUrlParams, noUrlParamsDecoder }
export type Contract = AuthApi<
  "POST",
  "/user/voucher/claim",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  voucherID: VoucherID
}

export type ErrorCode =
  | "VOUCHER_NOT_FOUND"
  | "VOUCHER_FULLY_CLAIMED"
  | "VOUCHER_ALREADY_CLAIMED"
  | "VOUCHER_EXPIRED"

export type Payload = {
  success: boolean
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  success: JD.boolean,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
  "VOUCHER_FULLY_CLAIMED",
  "VOUCHER_ALREADY_CLAIMED",
  "VOUCHER_EXPIRED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  voucherID: voucherIDDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/user/voucher/claim",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
