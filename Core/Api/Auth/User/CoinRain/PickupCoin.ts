import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthUser,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import {
  CoinID,
  coinIDDecoder,
  CoinValue,
  coinValueDecoder,
} from "../../../../App/CoinRain"

export type UrlParams = NoUrlParams

export type BodyParams = {
  coinId: CoinID
}

export type ErrorCode =
  | "COIN_ALREADY_CLAIMED"
  | "COIN_NOT_FOUND"
  | "EVENT_NOT_ACTIVE"

export type Payload = {
  coinId: CoinID
  value: CoinValue
  newBalance: number
}

export type Contract = AuthApi<
  AuthUser,
  "POST",
  "/coin-rain/pickup",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "COIN_ALREADY_CLAIMED",
  "COIN_NOT_FOUND",
  "EVENT_NOT_ACTIVE",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  coinId: coinIDDecoder,
  value: coinValueDecoder,
  newBalance: JD.number,
})

export const bodyDecoder: JD.Decoder<BodyParams> = JD.object({
  coinId: coinIDDecoder,
})

export const contract: Contract = {
  method: "POST",
  route: "/coin-rain/pickup",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
