import * as JD from "decoders"
import { UserID, userIDDecoder } from "../../../App/User/UserID"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

export type Contract = AuthApi<
  AuthAdmin,
  "POST",
  "/admin/users/message",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  userID: UserID
  message: string
}

export type ErrorCode = "USER_NOT_FOUND" | "SEND_FAILED"
export type UrlParams = NoUrlParams

export type Payload = {
  success: boolean
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  success: JD.boolean,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "USER_NOT_FOUND",
  "SEND_FAILED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  userID: userIDDecoder,
  message: JD.string,
})

export const contract: Contract = {
  method: "POST",
  route: "/admin/users/message",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
