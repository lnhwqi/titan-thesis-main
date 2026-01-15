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
} from "../../../../../Core/Api/Public/Category/ListAll"

export type { ErrorCode, Payload }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.urlDecoder

export async function call(): Promise<Response> {
  return publicApi(contract, {}, {})
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "CATEGORY_NOT_FOUND":
        return "Unable to load category list."
    }
  })
}
