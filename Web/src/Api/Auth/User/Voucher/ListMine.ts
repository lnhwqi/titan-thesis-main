import { authApi, apiErrorString, ApiError, ApiResponse } from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../../Core/Api/Auth/Voucher/listMine"

export type { ErrorCode, Payload }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(): Promise<Response> {
  return authApi(contract, {}, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "INVALID_REQUEST":
        return "Invalid request."
    }
  })
}