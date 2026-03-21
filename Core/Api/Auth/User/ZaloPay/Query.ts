import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/zalopay/query",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  appTransID: string
}

export type ZaloPaymentStatus = "PENDING" | "SUCCESS" | "FAILED"

export type ErrorCode = "QUERY_FAILED"

export type Payload = {
  status: ZaloPaymentStatus
  returnCode: number
  returnMessage: string
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  appTransID: JD.string,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  status: JD.oneOf(["PENDING", "SUCCESS", "FAILED"]),
  returnCode: JD.number,
  returnMessage: JD.string,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "QUERY_FAILED",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/zalopay/query",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
