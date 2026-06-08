import { authApi, apiErrorString, ApiError, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
  BodyParams,
} from "../../../../../Core/Api/Auth/Admin/SupportAITraining"

export type { ErrorCode, Payload, BodyParams }
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(params: BodyParams): Promise<Response> {
  return authApi(contract, {}, params)
}

export function errorString(code: ApiError<ErrorCode>): string {
  return apiErrorString(code, (errorCode) => {
    switch (errorCode) {
      case "PINECONE_NOT_CONFIGURED":
        return "Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME in API env."
      case "INGESTION_ALREADY_RUNNING":
        return "Another AI training operation is already running. Please wait until it finishes."
      case "TRAINING_FAILED":
        return "AI training operation failed. Check API logs for details."
    }
  })
}
