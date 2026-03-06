import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../Data/Api"
import { Voucher, voucherDecoder } from "../../../App/Voucher"
import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"

export type UrlParams = {
  id: VoucherID
}

export type Contract = AuthApi<
  AuthSeller,
  "GET",
  "/seller/voucher/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "VOUCHER_NOT_FOUND"

export type Payload = {
  voucher: Voucher
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  voucher: voucherDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: voucherIDDecoder,
})

export const contract: Contract = {
  method: "GET",
  route: "/seller/voucher/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
