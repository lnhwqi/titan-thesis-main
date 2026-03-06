import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../Data/Api/Auth"
import { Voucher, voucherDecoder } from "../../../App/Voucher"
import { VoucherID, voucherIDDecoder } from "../../../App/Voucher/VoucherID"
import {
  VoucherName,
  voucherNameDecoder,
} from "../../../App/Voucher/VoucherName"
import {
  UsageLimit,
  usageLimitDecoder,
} from "../../../App/Voucher/VoucherLimit"
import {
  ExpiredDate,
  expiredDateDecoder,
} from "../../../App/Voucher/VoucherExpiredDate"
import { Active, activeDecoder } from "../../../App/Voucher/VoucherActive"

export type UrlParams = {
  id: VoucherID
}

export type BodyParams = {
  name: VoucherName
  limit: UsageLimit
  expiredDate: ExpiredDate
  active: Active
}

export type Contract = AuthApi<
  AuthSeller,
  "PUT",
  "/seller/voucher/:id",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "VOUCHER_NOT_FOUND" | "INVALID_EXPIRED_DATE"

export type Payload = {
  voucher: Voucher
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  voucher: voucherDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_NOT_FOUND",
  "INVALID_EXPIRED_DATE",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: voucherIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: voucherNameDecoder,
  limit: usageLimitDecoder,
  expiredDate: expiredDateDecoder,
  active: activeDecoder,
})

export const contract: Contract = {
  method: "PUT",
  route: "/seller/voucher/:id",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
