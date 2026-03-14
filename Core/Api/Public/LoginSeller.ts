import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../Data/Api"
import { Seller, sellerDecoder } from "../../App/Seller"
import { Email, emailDecoder } from "../../Data/User/Email"
import { Password, passwordDecoder } from "../../App/Seller/Password"
import { AccessToken, accessTokenDecoder } from "../../App/Seller/AccessToken"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"

export type Contract = Api<
  "POST",
  "/seller/login",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  email: Email
  password: Password
}

export type ErrorCode =
  | "SELLER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "ACCOUNT_BANNED"

export type Payload = {
  seller: Seller
  accessToken: AccessToken
  refreshToken: RefreshToken
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  seller: sellerDecoder,
  accessToken: accessTokenDecoder,
  refreshToken: refreshTokenDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "SELLER_NOT_FOUND",
  "INVALID_PASSWORD",
  "ACCOUNT_BANNED",
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  email: emailDecoder,
  password: passwordDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/seller/login",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
