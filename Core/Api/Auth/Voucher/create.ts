import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

// Import your strict domain types and decoders
import { Voucher, voucherDecoder } from "../../../App/Voucher"
import {
  VoucherName,
  voucherNameDecoder,
} from "../../../App/Voucher/VoucherName"
import {
  VoucherCode,
  voucherCodeDecoder,
} from "../../../App/Voucher/VoucherCode"
import {
  VoucherDiscount,
  voucherDiscountDecoder,
} from "../../../App/Voucher/VoucherDiscount"
import {
  MinOrderValue,
  minOrderValueDecoder,
} from "../../../App/Voucher/VoucherMinOrderValue"
import {
  UsageLimit,
  usageLimitDecoder,
} from "../../../App/Voucher/VoucherLimit"
import {
  ExpiredDate,
  expiredDateDecoder,
} from "../../../App/Voucher/VoucherExpiredDate"
import { Active, activeDecoder } from "../../../App/Voucher/VoucherActive"

export type Contract = AuthApi<
  "POST",
  "/seller/voucher",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  name: VoucherName
  code: VoucherCode
  discount: VoucherDiscount
  minOrderValue: MinOrderValue
  limit: UsageLimit
  expiredDate: ExpiredDate
}

export type ErrorCode = "VOUCHER_CODE_ALREADY_EXISTS" | "INVALID_EXPIRED_DATE"

export type Payload = {
  voucher: Voucher
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  voucher: voucherDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "VOUCHER_CODE_ALREADY_EXISTS",
  "INVALID_EXPIRED_DATE",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: voucherNameDecoder,
  code: voucherCodeDecoder,
  discount: voucherDiscountDecoder,
  minOrderValue: minOrderValueDecoder,
  limit: usageLimitDecoder,
  expiredDate: expiredDateDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/seller/voucher",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
