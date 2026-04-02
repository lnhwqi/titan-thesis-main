import * as API from "../../../../../Core/Api/Auth/Seller/SellerProfile"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"
import * as SellerTierPolicyRow from "../../../Database/SellerTierPolicyRow"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  _params: API.BodyParams & API.UrlParams,
): Promise<Result<null, API.Payload>> {
  const policy = await SellerTierPolicyRow.getOrCreate()

  return ok({
    seller,
    sellerTierPolicy: {
      silverProfitThreshold: policy.silverProfitThreshold,
      goldProfitThreshold: policy.goldProfitThreshold,
      bronzeTax: policy.bronzeTax,
      silverTax: policy.silverTax,
      goldTax: policy.goldTax,
    },
  })
}
