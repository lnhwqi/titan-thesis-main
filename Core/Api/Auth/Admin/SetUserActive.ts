import * as JD from "decoders"
import { User, userDecoder } from "../../../App/User"
import { UserID, userIDDecoder } from "../../../App/User/UserID"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

export type Contract = AuthApi<
  AuthAdmin,
  "PATCH",
  "/admin/users/active",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  userID: UserID
  active: boolean
}

export type ErrorCode = "USER_NOT_FOUND" | "UPDATE_FAILED"
export type UrlParams = NoUrlParams

export type Payload = {
  user: User
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  user: userDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "USER_NOT_FOUND",
  "UPDATE_FAILED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  userID: userIDDecoder,
  active: JD.boolean,
})

export const contract: Contract = {
  method: "PATCH",
  route: "/admin/users/active",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
