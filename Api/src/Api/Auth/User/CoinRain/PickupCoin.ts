import * as API from "../../../../../../Core/Api/Auth/User/CoinRain/PickupCoin"
import { Result, ok, err } from "../../../../../../Core/Data/Result"
import type { AuthUser } from "../../../AuthApi"
import * as CoinRainTx from "../../../../Transaction/CoinRainTx"
import * as CoinRainRow from "../../../../Database/CoinRainRow"
import {
  coinIDDecoder,
  coinValueDecoder,
} from "../../../../../../Core/App/CoinRain"
export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  // Find the active campaign first so we can pass campaignId to the transaction
  const campaign = await CoinRainRow.findActiveCampaign()

  if (campaign == null) {
    return err("EVENT_NOT_ACTIVE")
  }

  const result = await CoinRainTx.claimCoin(
    params.coinId.unwrap(),
    user.id.unwrap(),
    campaign.id,
  )

  if (!result.success) {
    switch (result.reason) {
      case "EVENT_NOT_ACTIVE":
        return err("EVENT_NOT_ACTIVE")
      case "COIN_NOT_FOUND":
        return err("COIN_NOT_FOUND")
      case "COIN_ALREADY_CLAIMED":
        return err("COIN_ALREADY_CLAIMED")
    }
  }

  return ok({
    coinId: coinIDDecoder.verify(result.coinId),
    value: coinValueDecoder.verify(result.value),
    newBalance: result.newBalance,
  })
}
