import * as API from "../../../../../../Core/Api/Auth/Admin/CoinRain/UpsertCampaign"
import { Result, ok, err } from "../../../../../../Core/Data/Result"
import type { AuthAdmin } from "../../../AuthApi"
import * as CoinRainRow from "../../../../Database/CoinRainRow"
import { getCoinRainScheduler } from "../../../../CoinRainScheduler"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const startTime = new Date(params.startTime)

  if (isNaN(startTime.getTime())) {
    return err("INVALID_START_TIME")
  }

  if (params.coinPool.length === 0) {
    return err("INVALID_COIN_POOL")
  }

  const row = await CoinRainRow.upsertAdminCampaign({
    startTime,
    duration: params.duration,
    coinPool: params.coinPool,
  })

  // Reschedule the in-memory scheduler for the new campaign
  getCoinRainScheduler()?.reschedule(row)

  return ok({ campaign: CoinRainRow.rowToCampaign(row) })
}
