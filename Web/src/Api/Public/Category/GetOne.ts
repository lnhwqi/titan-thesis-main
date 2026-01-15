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
} from "../../../../../Core/Api/Public/Category/GetOne" // Ensure this matches your Core file path

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.urlDecoder

/**
 * Calls the Backend API to get a specific category.
 * @param params Contains the 'id' of the category
 */
export async function call(params: UrlParams): Promise<Response> {
  return publicApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "CATEGORY_NOT_FOUND":
        return "The requested category could not be found."
      default:
        return "An unexpected error occurred while loading the category."
    }
  })
}
