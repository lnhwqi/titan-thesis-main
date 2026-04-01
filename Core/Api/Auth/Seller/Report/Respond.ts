import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthSeller,
} from "../../../../Data/Api/Auth"
import {
  Report,
  reportDecoder,
  ReportID,
  reportIDDecoder,
  SellerDescription,
  sellerDescriptionDecoder,
  SellerUrlImgs,
  sellerUrlImgsDecoder,
} from "../../../../App/Report"
import { Maybe, maybeOptionalDecoder } from "../../../../Data/Maybe"

export type SellerReportAction = "SUBMIT_EVIDENCE" | "APPROVE_REPORT_REFUND"

export type UrlParams = {
  id: ReportID
}

export type BodyParams = {
  action: SellerReportAction
  sellerDescription: Maybe<SellerDescription>
  sellerUrlImgs: SellerUrlImgs
}

export type Contract = AuthApi<
  AuthSeller,
  "PUT",
  "/seller/report/:id/respond",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type ErrorCode =
  | "REPORT_NOT_FOUND"
  | "REPORT_NOT_FOR_SELLER"
  | "INVALID_STATUS_TRANSITION"
  | "INVALID_EVIDENCE"

export type Payload = {
  report: Report
}

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  report: reportDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "REPORT_NOT_FOUND",
  "REPORT_NOT_FOR_SELLER",
  "INVALID_STATUS_TRANSITION",
  "INVALID_EVIDENCE",
])

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: reportIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  action: JD.oneOf(["SUBMIT_EVIDENCE", "APPROVE_REPORT_REFUND"]),
  sellerDescription: maybeOptionalDecoder(sellerDescriptionDecoder),
  sellerUrlImgs: sellerUrlImgsDecoder,
}).transform((body) => {
  if (body.action === "SUBMIT_EVIDENCE") {
    const hasDescription = body.sellerDescription != null
    const hasImages = body.sellerUrlImgs.length > 0

    if (hasDescription === false && hasImages === false) {
      throw new Error("INVALID_EVIDENCE")
    }
  }

  return body
})

export const contract: Contract = {
  method: "PUT",
  route: "/seller/report/:id/respond",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
