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
} from "../../../../../../Core/Api/Auth/User/Wallet/DepositCreate"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "INVALID_AMOUNT":
        return "Deposit amount must be greater than zero."
      case "CREATE_FAILED":
        return "Unable to create ZaloPay deposit session."
      case "ACCOUNT_SUSPENDED":
        return "Your account is suspended. Please contact admin via chatbox."
    }
  })
}
