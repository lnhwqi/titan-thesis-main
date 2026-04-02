import * as API from "../../../../../../Core/Api/Auth/Admin/Report/List"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthAdmin } from "../../../AuthApi"
import * as ReportRow from "../../../../Database/ReportRow"
import { toReport } from "../../../../App/Report"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await ReportRow.listAll()

  return ok({
    reports: rows.map(toReport),
  })
}
