import * as API from "../../../../../../Core/Api/Auth/User/Report/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as ReportRow from "../../../../Database/ReportRow"
import { toReport } from "../../../../App/Report"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await ReportRow.listByUserID(user.id)

  return ok({
    reports: rows.map(toReport),
  })
}
