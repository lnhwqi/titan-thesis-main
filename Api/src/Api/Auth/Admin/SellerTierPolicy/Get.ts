import * as API from "../../../../../../Core/Api/Auth/Admin/SellerTierPolicy/Get"
import { Result, ok } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as SellerTierPolicyRow from "../../../../Database/SellerTierPolicyRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const policy = await SellerTierPolicyRow.getOrCreate()

  return ok({
    sellerTierPolicy: {
      silverProfitThreshold: policy.silverProfitThreshold,
      goldProfitThreshold: policy.goldProfitThreshold,
      bronzeTax: policy.bronzeTax,
      silverTax: policy.silverTax,
      goldTax: policy.goldTax,
    },
  })
}
