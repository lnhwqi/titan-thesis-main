import {
  publicApi,
  apiErrorString,
  ApiError,
  ApiResponse,
} from "../../PublicApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../Core/Api/Public/Address/GetProvince"

export type { ErrorCode, Payload }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(): Promise<Response> {
  return publicApi(contract, {}, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "GHN_ERROR":
        return "Unable to load provinces."
    }
  })
}
