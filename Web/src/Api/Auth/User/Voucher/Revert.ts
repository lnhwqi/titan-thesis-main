import { authApi, apiErrorString, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../../../Core/Api/Auth/Voucher/revert"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "VOUCHER_NOT_FOUND":
        return "Voucher not found."
      case "VOUCHER_NOT_USED":
        return "Voucher has not been used."
    }
  })
}