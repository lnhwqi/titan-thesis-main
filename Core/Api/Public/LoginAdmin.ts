import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../Data/Api"
import { Admin, adminDecoder } from "../../App/Admin"
import { Email, emailDecoder } from "../../Data/User/Email"
import { Password, passwordDecoder } from "../../App/BaseProfile/Password"
import {
  AccessToken,
  accessTokenDecoder,
} from "../../App/BaseProfile/AccessToken"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"

export type Contract = Api<
  "POST",
  "/admin/login",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  email: Email
  password: Password
}

export type ErrorCode = "ADMIN_NOT_FOUND" | "INVALID_PASSWORD" | "ACCESS_DENIED"

export type Payload = {
  admin: Admin
  accessToken: AccessToken
  refreshToken: RefreshToken
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  admin: adminDecoder,
  accessToken: accessTokenDecoder,
  refreshToken: refreshTokenDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "ADMIN_NOT_FOUND",
  "INVALID_PASSWORD",
  "ACCESS_DENIED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  email: emailDecoder,
  password: passwordDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/admin/login",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
