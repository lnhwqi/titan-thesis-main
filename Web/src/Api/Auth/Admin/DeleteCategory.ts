import { authApi, apiErrorString, ApiError, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
  NoBodyParams,
} from "../../../../../Core/Api/Auth/Admin/DeleteCategory"

export type { ErrorCode, Payload, UrlParams, NoBodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const urlDecoder = contract.urlDecoder

export async function call(urlParams: UrlParams): Promise<Response> {
  return authApi(contract, urlParams, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "CATEGORY_NOT_FOUND":
        return "Category not found."
    }
  })
}
