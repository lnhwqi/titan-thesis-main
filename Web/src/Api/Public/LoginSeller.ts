import { publicApi, apiErrorString, ApiError, ApiResponse } from "../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../Core/Api/Public/LoginSeller"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return publicApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "SELLER_NOT_FOUND":
        return "Seller is not found."
      case "INVALID_PASSWORD":
        return "Password is incorrect. Please try again."
      case "ACCOUNT_BANNED":
        return "Seller account is banned."
    }
  })
}
