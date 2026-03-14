import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as Login from "../Api/Public/Admin/Login"
import * as Logout from "../Api/Auth/Admin/Logout"
import * as RefreshToken from "../Api/Public/RefreshTokenAdmin"
import * as HomeAdmin from "../Api/Auth/Admin/HomeAdmin"
import * as ListPendingSellers from "../Api/Auth/Admin/ListPendingSellers"
import * as SendSellerVerifyEmail from "../Api/Auth/Admin/SendSellerVerifyEmail"
import * as ApproveSeller from "../Api/Auth/Admin/ApproveSeller"
import { adminAuthApi } from "../Api/AuthApi"

export function adminRoutes(app: Express): void {
  publicApi(app, Login)
  publicApi(app, RefreshToken)
  adminAuthApi(app, Logout)
  adminAuthApi(app, HomeAdmin)
  adminAuthApi(app, ListPendingSellers)
  adminAuthApi(app, SendSellerVerifyEmail)
  adminAuthApi(app, ApproveSeller)
}
