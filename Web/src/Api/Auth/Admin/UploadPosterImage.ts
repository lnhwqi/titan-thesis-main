import { authApi, apiErrorString, ApiError, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
  UploadImageFile,
} from "../../../../../Core/Api/Auth/Admin/UploadPosterImage"

export type { ErrorCode, Payload, BodyParams, UploadImageFile }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "NO_FILE":
        return "Select an image file first."
      case "INVALID_FILE":
        return "Only image files up to 2 MB are allowed."
      case "UPLOAD_FAILED":
        return "Unable to upload image right now."
    }
  })
}
