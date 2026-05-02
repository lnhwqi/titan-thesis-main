import { publicApi, ApiError, ApiResponse } from "../../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../Core/Api/Public/CoinRain/GetCampaign"

export type { ErrorCode, Payload }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(): Promise<Response> {
  return publicApi(contract, {}, {})
}

export function errorString(_code: ApiError<ErrorCode>): string {
  return "An error occurred."
}
