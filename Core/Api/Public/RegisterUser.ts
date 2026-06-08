import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../Data/Api"
import { User, userDecoder } from "../../App/User"
import { Email, emailDecoder } from "../../Data/User/Email"
import { Password, passwordDecoder } from "../../App/User/Password"
import { Name, nameDecoder } from "../../App/User/Name"
import { AccessToken, accessTokenDecoder } from "../../App/User/AccessToken"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"
export type UrlParams = NoUrlParams
export type Contract = Api<
  "POST",
  "/register",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  name: Name
  email: Email
  password: Password
  otpCode?: string
}

export type ErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "WEAK_PASSWORD"
  | "OTP_REQUIRED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_SEND_FAILED"
  | "OTP_RATE_LIMITED"

export type Payload = {
  user: User
  accessToken: AccessToken
  refreshToken: RefreshToken
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  user: userDecoder,
  accessToken: accessTokenDecoder,
  refreshToken: refreshTokenDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "EMAIL_ALREADY_EXISTS",
  "WEAK_PASSWORD",
  "OTP_REQUIRED",
  "OTP_INVALID",
  "OTP_EXPIRED",
  "OTP_SEND_FAILED",
  "OTP_RATE_LIMITED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: nameDecoder,
  email: emailDecoder,
  password: passwordDecoder,
  otpCode: JD.optional(JD.string.transform((s) => s.trim())),
})

export const contract: Contract = {
  method: "POST",
  route: "/register",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
