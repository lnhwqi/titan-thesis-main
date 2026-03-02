import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"
import { Maybe, maybeDecoder } from "../../../Data/Maybe"
import { Voucher, voucherDecoder } from "../../../App/Voucher"

export type { NoUrlParams }
export { noUrlParamsDecoder }

export type QueryParams = {
  minDiscount: Maybe<number>
  maxDiscount: Maybe<number>
  isExpired: Maybe<boolean>
}

export type Contract = AuthApi<
  "GET",
  "/seller/vouchers",
  NoUrlParams,
  QueryParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "INVALID_REQUEST"

export type Payload = {
  vouchers: Voucher[]
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  vouchers: JD.array(voucherDecoder),
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_REQUEST",
])

export const queryParamsDecoder: JD.Decoder<QueryParams> = JD.object({
  minDiscount: maybeDecoder(JD.number),
  maxDiscount: maybeDecoder(JD.number),
  isExpired: maybeDecoder(JD.boolean),
})

export const contract: Contract = {
  method: "GET",
  route: "/seller/vouchers",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: queryParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
