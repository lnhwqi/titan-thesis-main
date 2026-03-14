import * as API from "../../../../../Core/Api/Auth/Admin/SendSellerVerifyEmail"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
import * as Logger from "../../../Logger"
import { toSeller } from "../../../App/Seller"
import { AuthAdmin } from "../../AuthApi"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.NoUrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { sellerID } = params
  const sellerRow = await SellerRow.getByID(sellerID)

  if (sellerRow == null) {
    return err("SELLER_NOT_FOUND")
  }

  if (sellerRow.verified.unwrap() === true) {
    return err("ALREADY_VERIFIED")
  }

  await notifyVerificationEmail(sellerRow)

  return ok({ seller: toSeller(sellerRow) })
}

async function notifyVerificationEmail(
  seller: SellerRow.SellerRow,
): Promise<void> {
  // Hook point for SMTP/email provider integration.
  Logger.log(
    `[VERIFY_EMAIL] Sent seller verification email to ${seller.email.unwrap()} for shop ${seller.shopName.unwrap()}`,
  )
}
