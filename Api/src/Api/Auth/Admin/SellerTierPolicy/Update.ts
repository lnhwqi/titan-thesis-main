import * as API from "../../../../../../Core/Api/Auth/Admin/SellerTierPolicy/Update"
import { Result, err, ok } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as SellerTierPolicyRow from "../../../../Database/SellerTierPolicyRow"
import * as SellerRow from "../../../../Database/SellerRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  if (
    params.goldProfitThreshold.unwrap() < params.silverProfitThreshold.unwrap()
  ) {
    return err("INVALID_POLICY")
  }

  const normalizedPolicy = SellerTierPolicyRow.normalizePolicyInput(params)

  const updated = await SellerTierPolicyRow.update(normalizedPolicy)
  await SellerRow.syncAllTierAndTaxByProfit()

  return ok({
    sellerTierPolicy: {
      silverProfitThreshold: updated.silverProfitThreshold,
      goldProfitThreshold: updated.goldProfitThreshold,
      bronzeTax: updated.bronzeTax,
      silverTax: updated.silverTax,
      goldTax: updated.goldTax,
    },
  })
}
