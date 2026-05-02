import { authApi, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../../Core/Api/Auth/Admin/CoinRain/GetCampaign"

export type { ErrorCode, Payload }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(): Promise<Response> {
  return authApi(contract, {}, {})
}

export function errorString(_code: ApiError<ErrorCode>): string {
  return "An error occurred."
}
