import * as API from "../../../../../Core/Api/Auth/Admin/ApproveSeller"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
import { toSeller } from "../../../App/Seller"

export async function handler({
  bodyParams,
}: {
  bodyParams: API.BodyParams
  urlParams: API.NoUrlParams
}): Promise<Result<API.ErrorCode, API.Payload>> {
  const { sellerID } = bodyParams
  const sellerRow = await SellerRow.getByID(sellerID)
  if (sellerRow == null) return err("SELLER_NOT_FOUND")
  if (sellerRow.verified.unwrap() === true) return err("ALREADY_VERIFIED")
  const updatedRow = await SellerRow.updateVerified(sellerID, true)

  if (updatedRow == null) {
    throw new Error("DATABASE_UPDATE_FAILED")
  }
  return ok({
    seller: toSeller(updatedRow),
  })
}
