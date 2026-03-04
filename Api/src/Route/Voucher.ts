import { Express } from "express"
import * as applyVoucher from "../Api/Auth/Voucher/apply"
import * as claimVoucher from "../Api/Auth/Voucher/claim"
import * as createVoucher from "../Api/Auth/Voucher/create"
import * as deleteVoucher from "../Api/Auth/Voucher/delete"
import * as listVoucher from "../Api/Auth/Voucher/list"
import * as listAvailableVoucher from "../Api/Auth/Voucher/listAvailable"
import * as listMineVoucher from "../Api/Auth/Voucher/listMine"
import * as revertVoucher from "../Api/Auth/Voucher/revert"
import * as updateVoucher from "../Api/Auth/Voucher/update"
import * as validateVoucher from "../Api/Auth/Voucher/validate"

import { authApi } from "../Api/AuthApi"
import * as UserRow from "../Database/UserRow"
import * as SellerRow from "../Database/SellerRow"

export function VoucherRoutes(app: Express): void {
  authApi(app, applyVoucher, UserRow.getByID)
  authApi(app, claimVoucher, UserRow.getByID)
  authApi(app, listAvailableVoucher, UserRow.getByID)
  authApi(app, listMineVoucher, UserRow.getByID)
  authApi(app, revertVoucher, UserRow.getByID)
  authApi(app, validateVoucher, UserRow.getByID)

  //FOR SELLER
  authApi(app, createVoucher, SellerRow.getByID)
  authApi(app, updateVoucher, SellerRow.getByID)
  authApi(app, deleteVoucher, SellerRow.getByID)
  authApi(app, listVoucher, SellerRow.getByID)
}
