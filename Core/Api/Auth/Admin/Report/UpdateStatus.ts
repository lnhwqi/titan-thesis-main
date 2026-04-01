import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import {
  Report,
  reportDecoder,
  ReportID,
  reportIDDecoder,
  ReportStatus,
  reportStatusDecoder,
  ResultTextAdmin,
  resultTextAdminDecoder,
} from "../../../../App/Report"
import { Maybe, maybeOptionalDecoder } from "../../../../Data/Maybe"

export type UrlParams = {
  id: ReportID
}

export type BodyParams = {
  status: ReportStatus
  resultTextAdmin: Maybe<ResultTextAdmin>
}

export type Contract = AuthApi<
  AuthAdmin,
  "PUT",
  "/admin/report/:id/status",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode = "REPORT_NOT_FOUND" | "INVALID_STATUS_TRANSITION"

export type Payload = {
  report: Report
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  report: reportDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "REPORT_NOT_FOUND",
  "INVALID_STATUS_TRANSITION",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: reportIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  status: reportStatusDecoder,
  resultTextAdmin: maybeOptionalDecoder(resultTextAdminDecoder),
})

export const contract: Contract = {
  method: "PUT",
  route: "/admin/report/:id/status",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
