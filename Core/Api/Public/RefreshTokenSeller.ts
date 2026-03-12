import * as JD from "decoders"
import {
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
  responseDecoder,
} from "../../Data/Api"
import { Seller, sellerDecoder } from "../../App/Seller"
import { UserID, userIDDecoder } from "../../App/Admin/AdminID"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"
import { AccessToken, accessTokenDecoder } from "../../App/Admin/AccessToken"

export type Contract = Api<
  "POST",
  "/seller/refresh-token",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  userID: UserID
  refreshToken: RefreshToken
}

export type Payload = {
  seller: Seller
  accessToken: AccessToken
  refreshToken: RefreshToken
}

export type ErrorCode = "INVALID"

export const contract: Contract = {
  method: "POST",
  route: "/seller/refresh-token",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: JD.object({
    userID: userIDDecoder,
    refreshToken: refreshTokenDecoder,
  }),
  responseDecoder: responseDecoder(
    JD.oneOf(["INVALID"]),
    JD.object({
      seller: sellerDecoder,
      accessToken: accessTokenDecoder,
      refreshToken: refreshTokenDecoder,
    }),
  ),
}
