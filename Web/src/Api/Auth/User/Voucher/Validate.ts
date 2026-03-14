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
} from "../../../../../../Core/Api/Auth/Voucher/validate"

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
      case "VOUCHER_NOT_IN_WALLET":
        return "Voucher is not in your wallet."
      case "VOUCHER_EXPIRED":
        return "Voucher has expired."
      case "MIN_ORDER_VALUE_NOT_MET":
        return "Order value does not meet voucher minimum."
      case "VOUCHER_ALREADY_USED":
        return "Voucher has already been used."
    }
  })
}
