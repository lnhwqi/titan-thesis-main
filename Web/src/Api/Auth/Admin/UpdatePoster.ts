import { authApi, apiErrorString, ApiError, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  UrlParams,
  BodyParams,
} from "../../../../../Core/Api/Auth/Admin/UpdatePoster"

export type { ErrorCode, Payload, UrlParams, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export const urlParamsDecoder = contract.urlDecoder
export const bodyParamsDecoder = contract.bodyDecoder

export async function call(
  urlParams: UrlParams,
  bodyParams: BodyParams,
): Promise<Response> {
  return authApi(contract, urlParams, bodyParams)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "POSTER_NOT_FOUND":
        return "Poster not found."
      case "INVALID_DATE_RANGE":
        return "Invalid date range. End date must be after start date or set as permanent."
    }
  })
}
