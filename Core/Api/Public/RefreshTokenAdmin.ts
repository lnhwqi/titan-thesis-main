import * as JD from "decoders"
import {
  Api,
  NoUrlParams,
  noUrlParamsDecoder,
  responseDecoder,
} from "../../Data/Api"
import { Admin, adminDecoder } from "../../App/Admin"
import { AdminID, adminIDDecoder } from "../../App/Admin/AdminID"
import {
  RefreshToken,
  refreshTokenDecoder,
} from "../../Data/Security/RefreshToken"
import { AccessToken, accessTokenDecoder } from "../../App/Admin/AccessToken"

export type Contract = Api<
  "POST",
  "/admin/refresh-token",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type BodyParams = {
  adminID: AdminID
  refreshToken: RefreshToken
}

export type Payload = {
  admin: Admin
  accessToken: AccessToken
  refreshToken: RefreshToken
}

export type ErrorCode = "INVALID"

export const contract: Contract = {
  method: "POST",
  route: "/admin/refresh-token",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: JD.object({
    adminID: adminIDDecoder,
    refreshToken: refreshTokenDecoder,
  }),
  responseDecoder: responseDecoder(
    JD.oneOf(["INVALID"]),
    JD.object({
      admin: adminDecoder,
      accessToken: accessTokenDecoder,
      refreshToken: refreshTokenDecoder,
    }),
  ),
}
