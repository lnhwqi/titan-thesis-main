import {
  publicApi,
  apiErrorString,
  ApiError,
  ApiResponse,
} from "../../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
} from "../../../../../Core/Api/Public/Product/ListRatings"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

/**
 * Calls Backend API to get product ratings.
 * @param params Contains 'productID'
 */
export async function call(params: UrlParams): Promise<Response> {
  return publicApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, () => {
    return "Failed to load product ratings."
  })
}
