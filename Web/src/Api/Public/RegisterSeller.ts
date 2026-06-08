import { publicApi, apiErrorString, ApiError, ApiResponse } from "../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../Core/Api/Public/RegisterSeller"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return publicApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "EMAIL_ALREADY_EXISTS":
        return "Email is already registered."
      case "SHOP_NAME_TAKEN":
        return "Shop name is already taken."
      case "WEAK_PASSWORD":
        return "Password is too weak."
      case "OTP_REQUIRED":
        return "An OTP was sent to your email. Enter it and submit again."
      case "OTP_INVALID":
        return "Invalid OTP code. Please try again."
      case "OTP_EXPIRED":
        return "OTP has expired. Please request a new code."
      case "OTP_SEND_FAILED":
        return "Failed to send OTP email. Please try again shortly."
      case "OTP_RATE_LIMITED":
        return "OTP was sent recently. Please wait before requesting another code."
    }
  })
}
