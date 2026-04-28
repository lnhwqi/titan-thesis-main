import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
} from "../../../Data/Api"
import {
  payloadDecoder as supportMetricsPayloadDecoder,
  type Payload as SupportMetricsPayload,
} from "./SupportAIMetrics"

const DEFAULT_HISTORY_LIMIT = 120
const MAX_HISTORY_LIMIT = 200

export type UrlParams = {
  limit: number
}

export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type PersistedSnapshot = {
  id: string
  generatedAt: string
  lastEventAt: string | null
  createdAt: string
  snapshot: SupportMetricsPayload
}

export type Payload = {
  items: PersistedSnapshot[]
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  limit: JD.optional(JD.either(JD.string, JD.number)),
}).transform((obj) => {
  const parsed = obj.limit == null ? DEFAULT_HISTORY_LIMIT : Number(obj.limit)
  const safe = Number.isNaN(parsed) ? DEFAULT_HISTORY_LIMIT : parsed
  const normalized = Math.floor(safe)

  return {
    limit: Math.max(1, Math.min(MAX_HISTORY_LIMIT, normalized)),
  }
})

const persistedSnapshotDecoder: JD.Decoder<PersistedSnapshot> = JD.object({
  id: JD.string,
  generatedAt: JD.string,
  lastEventAt: JD.nullable(JD.string),
  createdAt: JD.string,
  snapshot: supportMetricsPayloadDecoder,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  items: JD.array(persistedSnapshotDecoder),
})

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/support-ai-metrics/history?limit=:limit",
  UrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export const contract: Contract = {
  method: "GET",
  route: "/admin/support-ai-metrics/history?limit=:limit",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
