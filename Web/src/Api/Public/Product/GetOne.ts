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
} from "../../../../../Core/Api/Public/Product/GetOne"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

/**
 * Calls Backend API to get product details.
 * @param params Contains 'id'
 */
export async function call(params: UrlParams): Promise<Response> {
  return publicApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "PRODUCT_NOT_FOUND":
        return "The requested product could not be found."
      default:
        return "An unexpected error occurred while loading product details."
    }
  })
}
