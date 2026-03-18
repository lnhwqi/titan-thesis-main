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
  UploadImageFile,
} from "../../../../../../Core/Api/Auth/Product/uploadImages"

export type { ErrorCode, Payload, BodyParams, UploadImageFile }
export type Response = ApiResponse<ErrorCode, Payload>

export const paramsDecoder = contract.bodyDecoder

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "NO_FILES":
        return "Select at least one image."
      case "INVALID_FILE":
        return "Only image files up to 2 MB are allowed."
      case "TOO_MANY_FILES":
        return "You can upload up to 5 images at once."
      case "UPLOAD_FAILED":
        return "Unable to upload images right now."
    }
  })
}
