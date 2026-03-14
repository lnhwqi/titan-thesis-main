import { publicApi, apiErrorString, ApiError, ApiResponse } from "../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../Core/Api/Public/RegisterUser"

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
      case "WEAK_PASSWORD":
        return "Password is too weak."
    }
  })
}
