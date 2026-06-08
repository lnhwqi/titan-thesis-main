import * as JD from "decoders"
import { AuthApi, authResponseDecoder, AuthAdmin } from "../../../Data/Api/Auth"
import { NoUrlParams, noUrlParamsDecoder } from "../../../Data/Api"

export type TrainingOperation = "CLEAR" | "INGEST"

export type UrlParams = NoUrlParams

export type BodyParams = {
  operation: TrainingOperation
}

export type ErrorCode =
  | "PINECONE_NOT_CONFIGURED"
  | "INGESTION_ALREADY_RUNNING"
  | "TRAINING_FAILED"

export type IngestionTableStat = {
  table: string
  scannedRows: number
  draftedRows: number
  embeddedRows: number
}

export type Payload = {
  operation: TrainingOperation
  message: string
  cleared: {
    vectorDocuments: number
    checkpoints: number
  } | null
  ingestion: {
    startedAt: string
    finishedAt: string
    scannedRows: number
    draftedRows: number
    embeddedRows: number
    tables: IngestionTableStat[]
  } | null
}

export const trainingOperationDecoder: JD.Decoder<TrainingOperation> = JD.oneOf(
  ["CLEAR", "INGEST"],
)

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  operation: trainingOperationDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PINECONE_NOT_CONFIGURED",
  "INGESTION_ALREADY_RUNNING",
  "TRAINING_FAILED",
])

const ingestionTableStatDecoder: JD.Decoder<IngestionTableStat> = JD.object({
  table: JD.string,
  scannedRows: JD.number,
  draftedRows: JD.number,
  embeddedRows: JD.number,
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  operation: trainingOperationDecoder,
  message: JD.string,
  cleared: JD.nullable(
    JD.object({
      vectorDocuments: JD.number,
      checkpoints: JD.number,
    }),
  ),
  ingestion: JD.nullable(
    JD.object({
      startedAt: JD.string,
      finishedAt: JD.string,
      scannedRows: JD.number,
      draftedRows: JD.number,
      embeddedRows: JD.number,
      tables: JD.array(ingestionTableStatDecoder),
    }),
  ),
})

export type Contract = AuthApi<
  AuthAdmin,
  "POST",
  "/admin/support-ai-training",
  NoUrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export const contract: Contract = {
  method: "POST",
  route: "/admin/support-ai-training",
  urlDecoder: noUrlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
