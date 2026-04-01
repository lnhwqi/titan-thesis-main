import {
  authApi,
  apiErrorString,
  ApiError,
  ApiResponse,
} from "../../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
  UrlParams,
} from "../../../../../../Core/Api/Auth/Admin/Report/UpdateStatus"

export type { ErrorCode, Payload, BodyParams, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(
  urlParams: UrlParams,
  bodyParams: BodyParams,
): Promise<Response> {
  return authApi(contract, urlParams, bodyParams)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "REPORT_NOT_FOUND":
        return "Report not found."
      case "INVALID_STATUS_TRANSITION":
        return "Invalid status transition for this report."
      case null:
        return "Unable to update report status."
    }
  })
}
