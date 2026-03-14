import * as API from "../../../../../Core/Api/Auth/Seller/UpdateSellerShop"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"

import * as SellerRow from "../../../Database/SellerRow"
import { toSeller } from "../../../App/Seller"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { shopName, shopDescription } = params

  const existingShop = await SellerRow.getByShopName(shopName)

  if (existingShop != null && existingShop.id.unwrap() !== seller.id.unwrap()) {
    return err("SHOP_NAME_ALREADY_EXISTS")
  }

  const updatedSellerRow = await SellerRow.updateShopProfile(
    seller.id,
    shopName,
    shopDescription,
  )

  return ok({
    seller: toSeller(updatedSellerRow),
  })
}
