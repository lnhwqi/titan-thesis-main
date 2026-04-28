import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import {
  NoBodyParams,
  noBodyParamsDecoder,
  NoErrorCode,
  noErrorCodeDecoder,
  NoUrlParams,
  noUrlParamsDecoder,
} from "../../../Data/Api"
import {
  payloadDecoder as supportMetricsPayloadDecoder,
  type Payload as SupportMetricsPayload,
} from "./SupportAIMetrics"

export type UrlParams = NoUrlParams
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
  "/admin/support-ai-metrics/history",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export const contract: Contract = {
  method: "GET",
  route: "/admin/support-ai-metrics/history",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
