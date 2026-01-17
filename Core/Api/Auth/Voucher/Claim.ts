import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"

import { NoBodyParams, noBodyParamsDecoder } from "../../../Data/Api"
import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"

export type Contract = AuthApi<
  "POST",
  "/vouchers/:id/claim",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: VoucherID
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: voucherIDDecoder,
})

export type ErrorCode =
  | "OUT_OF_TIME"
  | "ALREADY_OWNED"
  | "OUT_OF_STOCK"
  | "UNAUTHORIZED"

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "OUT_OF_TIME",
  "ALREADY_OWNED",
  "OUT_OF_STOCK",
  "UNAUTHORIZED",
])

export type Payload = { success: boolean }
export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  success: JD.boolean,
})

export const contract: Contract = {
  method: "POST",
  route: "/vouchers/:id/claim",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
