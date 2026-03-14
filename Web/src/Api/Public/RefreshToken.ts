import * as RefreshTokenUser from "../../../../Core/Api/Public/RefreshTokenUser"
import * as RefreshTokenSeller from "../../../../Core/Api/Public/RefreshTokenSeller"
import * as RefreshTokenAdmin from "../../../../Core/Api/Public/RefreshTokenAdmin"
import { Result, err, ok } from "../../../../Core/Data/Result"
import { Nat900 } from "../../../../Core/Data/Number/Nat"
import * as Queue from "../../../../Core/Data/Queue/AggregateQueue"
import { expiringWithin } from "../../../../Core/Data/Security/JsonWebToken"
import * as AuthToken from "../../App/AuthToken"
import { publicApi } from "../PublicApi"

/**
 * Request a new access token using the refresh token
 * if the current access token is expired/expiring soon
 * otherwise, return the current access token
 *
 * The function will ignore repeated calls while it is processing
 * This is necessary to prevent overwriting of newly issued tokens
 */
export const requestNewAccessToken = Queue.create(_requestNewAccessToken)

/**
 * The error codes are handled differently
 * as the context varies greatly
 * Basically we should not log the user out if there is no network
 */
export type ErrorCode =
  | "NETWORK_ERROR" /** Client has a network error so we should retry */
  | "SERVER_ERROR" /** Server has an unknown error so we should retry */
  | "MISSING_AUTH_TOKEN" /** The Auth Token is not found in local storage */
  | "INVALID" /** Refresh token is invalid */

export async function _requestNewAccessToken(): Promise<
  Result<ErrorCode, AuthToken.AuthToken>
> {
  const authToken = AuthToken.get()
  if (authToken == null) return err("MISSING_AUTH_TOKEN")

  switch (authToken.role) {
    case "USER": {
      if (expiringWithin(Nat900, authToken.accessToken) === false) {
        return ok(authToken)
      }

      const response = await publicApi(
        RefreshTokenUser.contract,
        {},
        {
          userID: authToken.userID,
          refreshToken: authToken.refreshToken,
        },
      )

      if (response._t === "Err") {
        return onRefreshError(response.error)
      }

      const newAuthToken: AuthToken.UserAuthToken = {
        role: "USER",
        userID: authToken.userID,
        accessToken: response.value.accessToken,
        refreshToken: response.value.refreshToken,
      }

      AuthToken.set(newAuthToken)
      return ok(newAuthToken)
    }

    case "SELLER": {
      if (expiringWithin(Nat900, authToken.accessToken) === false) {
        return ok(authToken)
      }

      const response = await publicApi(
        RefreshTokenSeller.contract,
        {},
        {
          sellerID: authToken.sellerID,
          refreshToken: authToken.refreshToken,
        },
      )

      if (response._t === "Err") {
        return onRefreshError(response.error)
      }

      const newAuthToken: AuthToken.SellerAuthToken = {
        role: "SELLER",
        sellerID: authToken.sellerID,
        accessToken: response.value.accessToken,
        refreshToken: response.value.refreshToken,
      }

      AuthToken.set(newAuthToken)
      return ok(newAuthToken)
    }

    case "ADMIN": {
      if (expiringWithin(Nat900, authToken.accessToken) === false) {
        return ok(authToken)
      }

      const response = await publicApi(
        RefreshTokenAdmin.contract,
        {},
        {
          adminID: authToken.adminID,
          refreshToken: authToken.refreshToken,
        },
      )

      if (response._t === "Err") {
        return onRefreshError(response.error)
      }

      const newAuthToken: AuthToken.AdminAuthToken = {
        role: "ADMIN",
        adminID: authToken.adminID,
        accessToken: response.value.accessToken,
        refreshToken: response.value.refreshToken,
      }

      AuthToken.set(newAuthToken)
      return ok(newAuthToken)
    }
  }
}

function onRefreshError(error: string): Result<ErrorCode, AuthToken.AuthToken> {
  switch (error) {
    case "PAYLOAD_TOO_LARGE":
    case "UNAUTHORISED":
    case "INVALID":
      AuthToken.remove()
      return err("INVALID")
    case "SERVER_ERROR":
    case "DECODE_ERROR":
      return err("SERVER_ERROR")
    case "NETWORK_ERROR":
      return err("NETWORK_ERROR")
    default:
      return err("SERVER_ERROR")
  }
}
