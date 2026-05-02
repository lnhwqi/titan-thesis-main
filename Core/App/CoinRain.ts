import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../Data/Opaque"
import { uuidDecoder } from "../Data/UUID"
import { natDecoder } from "../Data/Number/Nat"
import type { Nat } from "../Data/Number/Nat"

// --- CoinRainCampaignID ---
const campaignIdKey: unique symbol = Symbol()
export type CoinRainCampaignID = Opaque<string, typeof campaignIdKey>
export const coinRainCampaignIDDecoder: JD.Decoder<CoinRainCampaignID> =
  uuidDecoder.transform((uuid) =>
    jsonValueCreate<string, typeof campaignIdKey>(campaignIdKey)(uuid.unwrap()),
  )

// --- CoinID ---
const coinIdKey: unique symbol = Symbol()
export type CoinID = Opaque<string, typeof coinIdKey>
export const coinIDDecoder: JD.Decoder<CoinID> = uuidDecoder.transform((uuid) =>
  jsonValueCreate<string, typeof coinIdKey>(coinIdKey)(uuid.unwrap()),
)

// --- CoinValue ---
const coinValueKey: unique symbol = Symbol()
export type CoinValue = Opaque<number, typeof coinValueKey>
export const coinValueDecoder: JD.Decoder<CoinValue> = natDecoder.transform(
  (n) => jsonValueCreate<number, typeof coinValueKey>(coinValueKey)(n.unwrap()),
)

// --- CoinEntry: one tier in the pool ---
export type CoinEntry = {
  value: CoinValue
  quantity: Nat
}
export const coinEntryDecoder: JD.Decoder<CoinEntry> = JD.object({
  value: coinValueDecoder,
  quantity: natDecoder,
})

// --- CoinRainCampaign ---
export type CoinRainCampaign = {
  id: CoinRainCampaignID
  startTime: string // ISO-8601
  duration: Nat // seconds
  coinPool: CoinEntry[]
  isDefault: boolean
  isActive: boolean
}

export const coinRainCampaignDecoder: JD.Decoder<CoinRainCampaign> = JD.object({
  id: coinRainCampaignIDDecoder,
  startTime: JD.string,
  duration: natDecoder,
  coinPool: JD.array(coinEntryDecoder),
  isDefault: JD.boolean,
  isActive: JD.boolean,
})

// --- CoinRainCoin (individual claimable coin) ---
export type CoinRainCoin = {
  id: CoinID
  campaignId: CoinRainCampaignID
  value: CoinValue
  claimedByUserId: string | null
  claimedAt: string | null
}

export const coinRainCoinDecoder: JD.Decoder<CoinRainCoin> = JD.object({
  id: coinIDDecoder,
  campaignId: coinRainCampaignIDDecoder,
  value: coinValueDecoder,
  claimedByUserId: JD.nullable(JD.string),
  claimedAt: JD.nullable(JD.string),
})
