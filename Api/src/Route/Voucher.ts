import { Express } from "express"
import * as Claim from "../Api/Auth/Voucher/Claim"
import * as GetList from "../Api/Auth/Voucher/ListAll"
import { authApi } from "../Api/AuthApi"
export function VoucherRoutes(app: Express): void {
  authApi(app, Claim)
  authApi(app, GetList)
}
