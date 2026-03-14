import { UserID, userIDDecoder } from "../../../Core/App/User/UserID"
import { SellerID, sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import { AdminID, adminIDDecoder } from "../../../Core/App/Admin/AdminID"
import * as UserAccessToken from "../../../Core/App/User/AccessToken"
import * as SellerAccessToken from "../../../Core/App/Seller/AccessToken"
import * as AdminAccessToken from "../../../Core/App/Admin/AccessToken"
import {
  RefreshToken,
  unsafeToRefreshToken,
} from "../../../Core/Data/Security/RefreshToken"

export type UserAuthToken = {
  role: "USER"
  userID: UserID
  accessToken: UserAccessToken.AccessToken
  refreshToken: RefreshToken
}

export type SellerAuthToken = {
  role: "SELLER"
  sellerID: SellerID
  accessToken: SellerAccessToken.AccessToken
  refreshToken: RefreshToken
}

export type AdminAuthToken = {
  role: "ADMIN"
  adminID: AdminID
  accessToken: AdminAccessToken.AccessToken
  refreshToken: RefreshToken
}

export type AuthToken = UserAuthToken | SellerAuthToken | AdminAuthToken

// We obfuscate the keys for some security sake
const userIDKey = "_xu"
const roleKey = "_xr0"
const accessTokenKey = "_xa"
const refreshTokenKey = "_xr"

export function set(authToken: AuthToken): void {
  localStorage.setItem(roleKey, authToken.role)
  switch (authToken.role) {
    case "USER":
      localStorage.setItem(userIDKey, authToken.userID.unwrap())
      break
    case "SELLER":
      localStorage.setItem(userIDKey, authToken.sellerID.unwrap())
      break
    case "ADMIN":
      localStorage.setItem(userIDKey, authToken.adminID.unwrap())
      break
  }
  localStorage.setItem(accessTokenKey, String(authToken.accessToken.toJSON()))
  localStorage.setItem(refreshTokenKey, authToken.refreshToken.unwrap())
}

export function get(): AuthToken | null {
  const role = localStorage.getItem(roleKey)
  const id = localStorage.getItem(userIDKey)
  const accessToken = localStorage.getItem(accessTokenKey)
  const refreshToken = localStorage.getItem(refreshTokenKey)
  if (
    role == null ||
    id == null ||
    accessToken == null ||
    refreshToken == null
  ) {
    return null
  }

  switch (role) {
    case "USER": {
      const u = userIDDecoder.decode(id)
      const a = UserAccessToken.accessTokenDecoder.decode(accessToken)
      if (u.ok == false || a.ok == false) return null

      return {
        role: "USER",
        userID: u.value,
        accessToken: a.value,
        refreshToken: unsafeToRefreshToken(refreshToken),
      }
    }
    case "SELLER": {
      const s = sellerIDDecoder.decode(id)
      const a = SellerAccessToken.accessTokenDecoder.decode(accessToken)
      if (s.ok == false || a.ok == false) return null

      return {
        role: "SELLER",
        sellerID: s.value,
        accessToken: a.value,
        refreshToken: unsafeToRefreshToken(refreshToken),
      }
    }
    case "ADMIN": {
      const ad = adminIDDecoder.decode(id)
      const a = AdminAccessToken.accessTokenDecoder.decode(accessToken)
      if (ad.ok == false || a.ok == false) return null

      return {
        role: "ADMIN",
        adminID: ad.value,
        accessToken: a.value,
        refreshToken: unsafeToRefreshToken(refreshToken),
      }
    }
    default:
      return null
  }
}

export function remove(): void {
  localStorage.removeItem(roleKey)
  localStorage.removeItem(userIDKey)
  localStorage.removeItem(accessTokenKey)
  localStorage.removeItem(refreshTokenKey)
}
