import * as API from "../../../../../Core/Api/Public/CoinRain/GetCampaign"
import { Result, ok } from "../../../../../Core/Data/Result"
import * as CoinRainRow from "../../../Database/CoinRainRow"

export const contract = API.contract

export async function handler(
  _params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const row = await CoinRainRow.findActiveCampaign()
  return ok({ campaign: row != null ? CoinRainRow.rowToCampaign(row) : null })
}
