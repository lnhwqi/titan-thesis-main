import * as API from "../../../../../Core/Api/Public/Seller/GetProfile"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
import { toSellerPublicProfile } from "../../../App/SellerPublicProfile"

export const contract = API.contract

export async function handler(
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const sellerRow = await SellerRow.getByID(params.id)
  if (sellerRow == null || sellerRow.active.unwrap() === false) {
    return err("SELLER_NOT_FOUND")
  }

  return ok({ seller: toSellerPublicProfile(sellerRow) })
}
