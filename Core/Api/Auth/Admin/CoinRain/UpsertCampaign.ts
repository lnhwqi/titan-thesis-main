import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../../Data/Api"
import {
  CoinRainCampaign,
  coinRainCampaignDecoder,
} from "../../../../App/CoinRain"

export type UrlParams = NoUrlParams

export type CoinPoolEntry = { value: number; quantity: number }

export type BodyParams = {
  /** ISO-8601 datetime string */
  startTime: string
  /** Duration in seconds */
  duration: number
  coinPool: CoinPoolEntry[]
}

export type ErrorCode = "INVALID_START_TIME" | "INVALID_COIN_POOL"

export type Payload = {
  campaign: CoinRainCampaign
}

export type Contract = AuthApi<
  AuthAdmin,
  "PUT",
  "/admin/coin-rain/campaign",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "INVALID_START_TIME",
  "INVALID_COIN_POOL",
])

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  campaign: coinRainCampaignDecoder,
})

const coinPoolEntryDecoder: JD.Decoder<CoinPoolEntry> = JD.object({
  value: JD.number,
  quantity: JD.number,
})

export const bodyDecoder: JD.Decoder<BodyParams> = JD.object({
  startTime: JD.string,
  duration: JD.number,
  coinPool: JD.array(coinPoolEntryDecoder),
})

export const contract: Contract = {
  method: "PUT",
  route: "/admin/coin-rain/campaign",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
