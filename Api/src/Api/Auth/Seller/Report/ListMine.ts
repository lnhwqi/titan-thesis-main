import * as API from "../../../../../../Core/Api/Auth/Seller/Report/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import * as ReportRow from "../../../../Database/ReportRow"
import { toReport } from "../../../../App/Report"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await ReportRow.listBySellerID(seller.id)

  return ok({
    reports: rows.map(toReport),
  })
}
