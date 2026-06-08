import {
  authApi,
  apiErrorString,
  ApiError,
  ApiResponse,
} from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../../Core/Api/Auth/User/CoinRain/ListMine"

export type { ErrorCode, Payload }
export type { CoinTransaction } from "../../../../../../Core/Api/Auth/User/CoinRain/ListMine"
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(): Promise<Response> {
  return authApi(contract, {}, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(
    code,
    (_errorCode) => "Failed to load coin transactions.",
  )
}
