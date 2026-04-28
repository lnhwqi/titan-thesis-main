import * as API from "../../../../../Core/Api/Auth/Admin/SupportAIMetrics"
import { Result, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import { getSupportMetricsSnapshot } from "../../../AI/SupportMetrics"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  return ok(getSupportMetricsSnapshot())
}
