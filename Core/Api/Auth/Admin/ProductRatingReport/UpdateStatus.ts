import * as JD from "decoders"
import {
  AuthApi,
  authResponseDecoder,
  AuthAdmin,
} from "../../../../Data/Api/Auth"
import {
  ProductRatingReport,
  productRatingReportDecoder,
  ProductRatingReportID,
  productRatingReportIDDecoder,
  ProductRatingReportStatus,
} from "../../../../App/ProductRatingReport"

export type Contract = AuthApi<
  AuthAdmin,
  "PUT",
  "/admin/product-rating-report/:id/status",
  UrlParams,
  BodyParams,
  ErrorCode,
  Payload
>

export type UrlParams = {
  id: ProductRatingReportID
}

export type BodyParams = {
  status: Exclude<ProductRatingReportStatus, "OPEN">
}

export type ErrorCode =
  | "PRODUCT_RATING_REPORT_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"

export type Payload = {
  report: ProductRatingReport
}

export const urlParamsDecoder: JD.Decoder<UrlParams> = JD.object({
  id: productRatingReportIDDecoder,
})

export const bodyParamsDecoder: JD.Decoder<BodyParams> = JD.object({
  status: JD.oneOf(["UNDER_REVIEW", "APPROVED_DELETE", "REJECTED"]),
})

export const payloadDecoder: JD.Decoder<Payload> = JD.object({
  report: productRatingReportDecoder,
})

export const errorCodeDecoder: JD.Decoder<ErrorCode> = JD.oneOf([
  "PRODUCT_RATING_REPORT_NOT_FOUND",
  "INVALID_STATUS_TRANSITION",
])

export const contract: Contract = {
  method: "PUT",
  route: "/admin/product-rating-report/:id/status",
  urlDecoder: urlParamsDecoder,
  bodyDecoder: bodyParamsDecoder,
  responseDecoder: authResponseDecoder(errorCodeDecoder, payloadDecoder),
}
