import { authApi, apiErrorString, ApiError, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../../Core/Api/Auth/Admin/ReportWindow/Update"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "INVALID_REPORT_WINDOW":
        return "Report window hours must be greater than 0."
    }
  })
}
