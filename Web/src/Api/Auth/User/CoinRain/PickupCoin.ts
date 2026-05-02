import { authApi, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../../Core/Api/Auth/User/CoinRain/PickupCoin"
import type { CoinID } from "../../../../../../Core/App/CoinRain"

export type { ErrorCode, Payload }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(coinId: CoinID): Promise<Response> {
  return authApi(contract, {}, { coinId })
}

export function errorString(code: ApiError<ErrorCode>): string {
  switch (code) {
    case "COIN_ALREADY_CLAIMED":
      return "Someone else got this coin first!"
    case "COIN_NOT_FOUND":
      return "Coin not found."
    case "EVENT_NOT_ACTIVE":
      return "The event is not active."
    default:
      return "An error occurred."
  }
}
