import { authApi, apiErrorString, ApiError, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
  BodyParams,
} from "../../../../../Core/Api/Auth/Admin/UpdateCategory"

export type { ErrorCode, Payload, UrlParams, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const urlDecoder = contract.urlDecoder
export const bodyDecoder = contract.bodyDecoder

export async function call(
  urlParams: UrlParams,
  bodyParams: BodyParams,
): Promise<Response> {
  return authApi(contract, urlParams, bodyParams)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "CATEGORY_NOT_FOUND":
        return "Category not found."
      case "SLUG_ALREADY_EXISTS":
        return "Category slug already exists."
    }
  })
}
