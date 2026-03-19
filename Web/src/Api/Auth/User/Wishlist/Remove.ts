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
  UrlParams,
} from "../../../../../../Core/Api/Auth/User/Wishlist/Remove"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.urlDecoder

export async function call(params: UrlParams): Promise<Response> {
  return authApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (_errorCode) => {
    return "Failed to remove wishlist item."
  })
}
