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
} from "../../../../../Core/Api/Public/Seller/GetProfile"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(params: UrlParams): Promise<Response> {
  return publicApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "SELLER_NOT_FOUND":
        return "This seller profile is not available."
      default:
        return "Unable to load seller profile."
    }
  })
}
