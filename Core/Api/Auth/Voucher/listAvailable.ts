import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthUser } from "../../../Data/Api/Auth"
import {
  NoUrlParams,
  noUrlParamsDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
} from "../../../Data/Api"

import { Voucher, voucherDecoder } from "../../../App/Voucher"
export { NoUrlParams, noUrlParamsDecoder, NoBodyParams, noBodyParamsDecoder }
export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/user/vouchers/available",
  NoUrlParams,
  NoBodyParams,
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

export const contract: Contract = {
  method: "GET",
  route: "/user/vouchers/available",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
