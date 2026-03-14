import * as API from "../../../../../Core/Api/Auth/Admin/ApproveSeller"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
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
  const updatedRow = await SellerRow.updateVerified(sellerID, true)

  if (updatedRow == null) {
    return err("SELLER_NOT_FOUND")
  }

  return ok({
    seller: toSeller(updatedRow),
  })
}
