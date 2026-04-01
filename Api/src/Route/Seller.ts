import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as Login from "../Api/Public/Seller/Login"
import * as Register from "../Api/Public/Seller/Register"

import * as Logout from "../Api/Auth/Seller/Logout"
import * as Profile from "../Api/Auth/Seller/Profile"
import * as UpdateProfile from "../Api/Auth/Seller/UpdateSellerShop"
import * as RefreshToken from "../Api/Public/RefreshTokenSeller"
import * as HomeSeller from "../Api/Auth/Seller/HomeSeller"
import * as GetProfile from "../Api/Public/Seller/GetProfile"
import * as OrderPaymentUpdateTracking from "../Api/Auth/Seller/OrderPayment/UpdateTracking"
import * as OrderPaymentListMine from "../Api/Auth/Seller/OrderPayment/ListMine"
import * as UpdateWallet from "../Api/Auth/Seller/Wallet/Update"
import { sellerAuthApi } from "../Api/AuthApi"

export function sellerRoutes(app: Express): void {
  publicApi(app, Login)
  publicApi(app, Register)
  publicApi(app, RefreshToken)
  sellerAuthApi(app, Logout)
  sellerAuthApi(app, Profile)
  sellerAuthApi(app, UpdateProfile)
  sellerAuthApi(app, HomeSeller)
  sellerAuthApi(app, OrderPaymentListMine)
  sellerAuthApi(app, OrderPaymentUpdateTracking)
  sellerAuthApi(app, UpdateWallet)
  // Register generic /seller/:id route last to avoid swallowing specific routes.
  publicApi(app, GetProfile)
}
