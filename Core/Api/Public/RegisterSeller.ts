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
import { Name, nameDecoder } from "../../App/Seller/Name"
import { ShopName, shopNameDecoder } from "../../App/Seller/ShopName"
import { AccessToken, accessTokenDecoder } from "../../App/Seller/AccessToken"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"

export type UrlParams = NoUrlParams
export type Contract = Api<
  "POST",
  "/seller/register",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  name: Name
  email: Email
  password: Password
  shopName: ShopName
  otpCode?: string
}

export type ErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "SHOP_NAME_TAKEN"
  | "WEAK_PASSWORD"
  | "OTP_REQUIRED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_SEND_FAILED"
  | "OTP_RATE_LIMITED"

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
  "EMAIL_ALREADY_EXISTS",
  "SHOP_NAME_TAKEN",
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
  shopName: shopNameDecoder,
  otpCode: JD.optional(JD.string.transform((s) => s.trim())),
})

export const contract: Contract = {
  method: "POST",
  route: "/seller/register",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
