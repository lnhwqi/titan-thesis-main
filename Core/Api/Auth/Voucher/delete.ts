import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { NoBodyParams, noBodyParamsDecoder } from "../../../Data/Api"
import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"
export type { NoBodyParams }
export type UrlParams = {
  id: VoucherID
}

export type Contract = AuthApi<
  AuthSeller,
  "DELETE",
  "/seller/voucher/:id",
  UrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "VOUCHER_NOT_FOUND" | "VOUCHER_CANNOT_BE_DELETED"

export type Payload = {
  id: VoucherID
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  id: voucherIDDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
  "VOUCHER_CANNOT_BE_DELETED",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: voucherIDDecoder,
})

export const contract: Contract = {
  method: "DELETE",
  route: "/seller/voucher/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
