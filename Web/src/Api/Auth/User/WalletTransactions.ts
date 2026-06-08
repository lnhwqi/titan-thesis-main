import { authApi, ApiResponse } from "../../AuthApi"
import {
  contract,
  ErrorCode,
  Payload,
} from "../../../../../Core/Api/Auth/User/WalletTransactions"

export type {
  ErrorCode,
  Payload,
  WalletTransaction,
  WalletTransactionKind,
} from "../../../../../Core/Api/Auth/User/WalletTransactions"
export type Response = ApiResponse<ErrorCode, Payload>

export async function call(): Promise<Response> {
  return authApi(contract, {}, {})
}
