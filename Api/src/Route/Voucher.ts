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

import { userAuthApi, sellerAuthApi } from "../Api/AuthApi"

export function VoucherRoutes(app: Express): void {
  userAuthApi(app, applyVoucher)
  userAuthApi(app, claimVoucher)
  userAuthApi(app, listAvailableVoucher)
  userAuthApi(app, listMineVoucher)
  userAuthApi(app, revertVoucher)
  userAuthApi(app, validateVoucher)

  sellerAuthApi(app, createVoucher)
  sellerAuthApi(app, updateVoucher)
  sellerAuthApi(app, deleteVoucher)
  sellerAuthApi(app, listVoucher)
}
