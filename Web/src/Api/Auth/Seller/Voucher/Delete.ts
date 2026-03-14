import { authApi, apiErrorString, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
} from "../../../../../../Core/Api/Auth/Voucher/delete"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.urlDecoder

export async function call(params: UrlParams): Promise<Response> {
  return authApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "VOUCHER_NOT_FOUND":
        return "Voucher not found."
      case "VOUCHER_CANNOT_BE_DELETED":
        return "Voucher cannot be deleted."
    }
  })
}