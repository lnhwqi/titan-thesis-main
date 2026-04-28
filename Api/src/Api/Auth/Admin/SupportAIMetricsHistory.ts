import * as API from "../../../../../Core/Api/Auth/Admin/SupportAIMetricsHistory"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import { listRecentSnapshots } from "../../../Database/AISupportMetricsSnapshotRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const items = await listRecentSnapshots(params.limit)
  return ok({ items })
}
