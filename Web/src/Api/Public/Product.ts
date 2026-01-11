import { publicApi, apiErrorString, ApiError, ApiResponse } from "../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
} from "../../../../Core/Api/Public/Product/GetList"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.urlDecoder

export async function call(params: UrlParams): Promise<Response> {
  
  return publicApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "NO_PRODUCTS_FOUND":
        return "No products match your search."
      default:
        return "An unexpected error occurred."
    }
  })
}