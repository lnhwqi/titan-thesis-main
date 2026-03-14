import { authApi, apiErrorString, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
} from "../../../../../../Core/Api/Auth/Product/delete"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.urlDecoder

export async function call(params: UrlParams): Promise<Response> {
  return authApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "PRODUCT_NOT_FOUND":
        return "Product not found."
      case "FORBIDDEN_ACTION":
        return "You do not have permission to delete this product."
    }
  })
}