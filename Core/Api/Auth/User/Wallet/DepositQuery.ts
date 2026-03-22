import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import { User, userDecoder } from "../../../../App/User"

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/user/wallet/deposit/query",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams

export type BodyParams = {
  appTransID: string
}

export type DepositStatus = "PENDING" | "SUCCESS" | "FAILED"

export type ErrorCode = "QUERY_FAILED" | "DEPOSIT_NOT_FOUND"

export type Payload = {
  status: DepositStatus
  returnCode: number
  returnMessage: string
  user: User
}

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  appTransID: JD.string,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  status: JD.oneOf(["PENDING", "SUCCESS", "FAILED"]),
  returnCode: JD.number,
  returnMessage: JD.string,
  user: userDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "QUERY_FAILED",
  "DEPOSIT_NOT_FOUND",
])

export const contract: Contract = {
  method: "POST",
  route: "/user/wallet/deposit/query",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
