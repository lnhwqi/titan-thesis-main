import * as JD from "decoders"
import {
  Api,
  responseDecoder,
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"
import {
  CoinRainCampaign,
  coinRainCampaignDecoder,
} from "../../../App/CoinRain"

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type Payload = {
  campaign: CoinRainCampaign | null
}

export type Contract = Api<
  "GET",
  "/coin-rain/campaign",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  campaign: JD.nullable(coinRainCampaignDecoder),
})

export const contract: Contract = {
  method: "GET",
  route: "/coin-rain/campaign",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: responseDecoder(noErrorCodeDecoder, payloadDecoder),
}
