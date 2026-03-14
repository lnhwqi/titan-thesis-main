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
  QueryParams,
} from "../../../../../../Core/Api/Auth/Voucher/list"

export type { ErrorCode, Payload, QueryParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: QueryParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "INVALID_REQUEST":
        return "Invalid request parameters."
    }
  })
}
