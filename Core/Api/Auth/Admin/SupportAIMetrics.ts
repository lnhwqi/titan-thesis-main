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

export type UrlParams = NoUrlParams
export type BodyParams = NoBodyParams
export type ErrorCode = NoErrorCode

export type EventCounter = {
  event: string
  count: number
}

export type Payload = {
  generatedAt: string
  startedAt: string
  uptimeSeconds: number
  lastEventAt: string | null
  counters: EventCounter[]
  totals: {
    requests: number
    rejected: number
    rateLimited: number
    answersGenerated: number
    answersDelivered: number
    answersFailed: number
    fallbacksDelivered: number
  }
  latency: {
    sampleSize: number
    averageMs: number
    p95Ms: number
  }
  citations: {
    sampleSize: number
    averageIncluded: number
    averageRetrieved: number
  }
  rateLimits: {
    tooFast: number
    windowLimit: number
  }
  mapCleanup: {
    runCount: number
    totalRemoved: number
    lastSizeBefore: number
    lastSizeAfter: number
  }
}

const eventCounterDecoder: JD.Decoder<EventCounter> = JD.object({
  event: JD.string,
  count: JD.number,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  generatedAt: JD.string,
  startedAt: JD.string,
  uptimeSeconds: JD.number,
  lastEventAt: JD.nullable(JD.string),
  counters: JD.array(eventCounterDecoder),
  totals: JD.object({
    requests: JD.number,
    rejected: JD.number,
    rateLimited: JD.number,
    answersGenerated: JD.number,
    answersDelivered: JD.number,
    answersFailed: JD.number,
    fallbacksDelivered: JD.number,
  }),
  latency: JD.object({
    sampleSize: JD.number,
    averageMs: JD.number,
    p95Ms: JD.number,
  }),
  citations: JD.object({
    sampleSize: JD.number,
    averageIncluded: JD.number,
    averageRetrieved: JD.number,
  }),
  rateLimits: JD.object({
    tooFast: JD.number,
    windowLimit: JD.number,
  }),
  mapCleanup: JD.object({
    runCount: JD.number,
    totalRemoved: JD.number,
    lastSizeBefore: JD.number,
    lastSizeAfter: JD.number,
  }),
})

export type Contract = AuthApi<
  AuthAdmin,
  "GET",
  "/admin/support-ai-metrics",
  NoUrlParams,
  NoBodyParams,
  NoErrorCode,
  Payload
>

export const contract: Contract = {
  method: "GET",
  route: "/admin/support-ai-metrics",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: noBodyParamsDecoder,
  responseDecoder: authResponseDecoder(noErrorCodeDecoder, payloadDecoder),
}
