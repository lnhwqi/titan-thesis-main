import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthUser } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/user/wallet-transactions",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = never

export type WalletTransactionKind =
  | "COIN_RAIN" // coin pickup from event — adds to wallet
  | "DEPOSIT" // ZaloPay top-up — adds to wallet
  | "PAYMENT" // order paid from wallet — deducted

export type WalletTransaction = {
  id: string
  kind: WalletTransactionKind
  amount: number // always positive; direction implied by kind
  description: string
  occurredAt: string // ISO-8601
}

export type Payload = {
  transactions: WalletTransaction[]
  currentBalance: number
}

export const walletTransactionDecoder: JD.Decoder<WalletTransaction> =
  JD.object({
    id: JD.string,
    kind: JD.oneOf<WalletTransactionKind>(["COIN_RAIN", "DEPOSIT", "PAYMENT"]),
    amount: JD.number,
    description: JD.string,
    occurredAt: JD.string,
  })

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  transactions: JD.array(walletTransactionDecoder),
  currentBalance: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> =
  JD.never("no error codes")

export const contract: Contract = {
  method: "GET",
  route: "/user/wallet-transactions",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
