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
} from "../../../../../../Core/Api/Auth/Seller/Report/Respond"

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
      case "REPORT_NOT_FOR_SELLER":
        return "This report does not belong to your shop."
      case "INVALID_STATUS_TRANSITION":
        return "Invalid report status transition."
      case "INVALID_EVIDENCE":
        return "Please provide seller evidence description or images."
      case null:
        return "Unable to submit report response."
    }
  })
}
