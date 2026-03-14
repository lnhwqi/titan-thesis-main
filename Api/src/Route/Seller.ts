import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as Login from "../Api/Public/Seller/Login"
import * as Register from "../Api/Public/Seller/Register"

import * as Logout from "../Api/Auth/Seller/Logout"
import * as Profile from "../Api/Auth/Seller/Profile"
import * as UpdateProfile from "../Api/Auth/Seller/UpdateSellerShop"
import * as RefreshToken from "../Api/Public/RefreshTokenUser"
import * as HomeSeller from "../Api/Auth/Seller/HomeSeller"
import { sellerAuthApi } from "../Api/AuthApi"

export function userRoutes(app: Express): void {
  publicApi(app, Login)
  publicApi(app, Register)
  publicApi(app, RefreshToken)
  sellerAuthApi(app, Logout)
  sellerAuthApi(app, Profile)
  sellerAuthApi(app, UpdateProfile)
  sellerAuthApi(app, HomeSeller)
}
