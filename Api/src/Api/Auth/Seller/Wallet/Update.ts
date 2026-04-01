import * as API from "../../../../../../Core/Api/Auth/Seller/Wallet/Update"
import { Result, err, ok } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import * as SellerRow from "../../../../Database/SellerRow"
import { toSeller } from "../../../../App/Seller"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  try {
    const updated = await SellerRow.updateWallet(seller.id, params.wallet)

    return ok({
      seller: toSeller(updated),
    })
  } catch (_error: unknown) {
    return err("WALLET_UPDATE_FAILED")
  }
}
