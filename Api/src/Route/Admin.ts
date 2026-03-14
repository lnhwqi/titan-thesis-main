import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as Login from "../Api/Public/Admin/Login"
import * as Logout from "../Api/Auth/Admin/Logout"
import * as RefreshToken from "../Api/Public/RefreshTokenUser"
import * as HomeAdmin from "../Api/Auth/Admin/HomeAdmin"
import * as ApproveSeller from "../Api/Auth/Admin/ApproveSeller"
import { adminAuthApi } from "../Api/AuthApi"

export function userRoutes(app: Express): void {
  publicApi(app, Login)
  publicApi(app, RefreshToken)
  adminAuthApi(app, Logout)
  adminAuthApi(app, HomeAdmin)
  adminAuthApi(app, ApproveSeller)
}
