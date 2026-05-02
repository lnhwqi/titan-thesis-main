import * as API from "../../../../../../Core/Api/Auth/Admin/CoinRain/GetCampaign"
import { Result, ok } from "../../../../../../Core/Data/Result"
import type { AuthAdmin } from "../../../AuthApi"
import * as CoinRainRow from "../../../../Database/CoinRainRow"
import { rowToCampaign } from "../../../../Database/CoinRainRow"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const row = await CoinRainRow.findActiveCampaign()
  return ok({ campaign: row != null ? rowToCampaign(row) : null })
}
