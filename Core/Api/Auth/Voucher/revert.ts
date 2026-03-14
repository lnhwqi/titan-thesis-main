import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthUser } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"

export type { NoUrlParams }

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/voucher/revert",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  voucherID: VoucherID
}

export type ErrorCode = "VOUCHER_NOT_FOUND" | "VOUCHER_NOT_USED"

export type Payload = {
  success: boolean
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  success: JD.boolean,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
  "VOUCHER_NOT_USED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  voucherID: voucherIDDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/user/voucher/revert",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
