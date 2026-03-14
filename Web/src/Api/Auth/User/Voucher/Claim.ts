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
} from "../../../../../../Core/Api/Auth/Voucher/claim"

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
      case "VOUCHER_FULLY_CLAIMED":
        return "Voucher is fully claimed."
      case "VOUCHER_ALREADY_CLAIMED":
        return "Voucher already claimed."
      case "VOUCHER_EXPIRED":
        return "Voucher has expired."
    }
  })
}
