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
} from "../../../../../../Core/Api/Auth/User/Report/Create"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "ORDER_PAYMENT_NOT_FOUND":
        return "Order payment not found."
      case "SELLER_NOT_FOUND":
        return "Seller not found for this order."
      case "ORDER_NOT_OWNED_BY_USER":
        return "You can only report your own order."
      case "REPORT_TITLE_MISMATCH":
        return "Report title does not match report category."
      case null:
        return "Unable to create report."
    }
  })
}
