import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../../Data/Api"
import {
  coinIDDecoder,
  CoinID,
  coinValueDecoder,
  CoinValue,
} from "../../../../App/CoinRain"

export type Contract = AuthApi<
  AuthUser,
  "GET",
  "/coin-rain/mine",
  NoUrlParams,
  NoBodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = never

export type CoinTransaction = {
  coinId: CoinID
  value: CoinValue
  claimedAt: string
}

export type Payload = {
  transactions: CoinTransaction[]
  totalCoins: number
}

export const coinTransactionDecoder: JD.Decoder<CoinTransaction> = JD.object({
  coinId: coinIDDecoder,
  value: coinValueDecoder,
  claimedAt: JD.string,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  transactions: JD.array(coinTransactionDecoder),
  totalCoins: JD.number,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> =
  JD.never("no error codes")

export const contract: Contract = {
  method: "GET",
  route: "/coin-rain/mine",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
