import * as JD from "decoders"

export type ReportStatus =
  | "OPEN"
  | "SELLER_REPLIED"
  | "UNDER_REVIEW"
  | "REFUND_APPROVED"
  | "CASHBACK_COMPLETED"
  | "RESOLVED"
  | "REJECTED"

export const reportStatusDecoder: JD.Decoder<ReportStatus> = JD.oneOf([
  "OPEN",
  "SELLER_REPLIED",
  "UNDER_REVIEW",
  "REFUND_APPROVED",
  "CASHBACK_COMPLETED",
  "RESOLVED",
  "REJECTED",
])
