import { authApi, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../../../Core/Api/Auth/Admin/CoinRain/UpsertCampaign"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(body: BodyParams): Promise<Response> {
  return authApi(contract, {}, body)
}

export function errorString(code: ApiError<ErrorCode>): string {
  switch (code) {
    case "INVALID_START_TIME":
      return "Invalid start time."
    case "INVALID_COIN_POOL":
      return "Coin pool cannot be empty."
    default:
      return "An error occurred."
  }
}
