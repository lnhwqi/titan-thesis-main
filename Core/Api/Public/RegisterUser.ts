import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../Data/Api"
import { User, userDecoder } from "../../App/User"
import { Email, emailDecoder } from "../../Data/User/Email"
import { Password, passwordDecoder } from "../../App/BaseProfile/Password"
import { Name, nameDecoder } from "../../App/BaseProfile/Name"
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
}

export type ErrorCode = "EMAIL_ALREADY_EXISTS" | "WEAK_PASSWORD"

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
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: nameDecoder,
  email: emailDecoder,
  password: passwordDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/register",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
