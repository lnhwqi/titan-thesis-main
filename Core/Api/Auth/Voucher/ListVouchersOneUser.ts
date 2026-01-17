import * as JD from "decoders"
import { AuthApi, authResponseDecoder } from "../../../Data/Api/Auth"

import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"
import { Voucher, voucherDecoder } from "../../../App/Voucher"
export type { NoUrlParams }

export type Contract = AuthApi<
  "GET",
  "/vouchers/my-list",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "UNAUTHORIZED" | "SERVER_ERROR"
export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "UNAUTHORIZED",
  "SERVER_ERROR",
])

export type Payload = Voucher[]
export const payloadDecoder: JD.Decoder<Payload> = JD.array(voucherDecoder)

export const contract: Contract = {
  method: "GET",
  route: "/vouchers/my-list",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
