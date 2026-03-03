import * as JD from "decoders"
import {
  responseDecoder,
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../Data/Api"
import { Seller, sellerDecoder } from "../../App/Seller"
import { Email, emailDecoder } from "../../Data/User/Email"
import { Password, passwordDecoder } from "../../App/BaseProfile/Password"
import { Name, nameDecoder } from "../../App/BaseProfile/Name"
import { ShopName, shopNameDecoder } from "../../App/Seller/ShopName"
import {
  AccessToken,
  accessTokenDecoder,
} from "../../App/BaseProfile/AccessToken"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"
export { NoUrlParams, noUrlParamsDecoder }
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
}

export type ErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "SHOP_NAME_TAKEN"
  | "WEAK_PASSWORD"

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
])

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  name: nameDecoder,
  email: emailDecoder,
  password: passwordDecoder,
  shopName: shopNameDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/seller/register",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: responseDecoder(errorCodeDecoder, payloadDecoder),
}
