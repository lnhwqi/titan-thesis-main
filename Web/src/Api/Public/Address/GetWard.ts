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
  UrlParams,
} from "../../../../../Core/Api/Public/Address/GetWard"

export type { ErrorCode, Payload, UrlParams }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(params: UrlParams): Promise<Response> {
  return publicApi(contract, params, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "GHN_ERROR":
        return "Unable to load wards."
    }
  })
}
