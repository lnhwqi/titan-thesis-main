import * as JD from "decoders"

export type ReportCategory =
  | "WRONG_ITEM"
  | "DEFECTIVE"
  | "ITEM_NOT_RECEIVED"
  | "FALSE_CLAIM"

export const reportCategoryDecoder: JD.Decoder<ReportCategory> = JD.oneOf([
  "WRONG_ITEM",
  "DEFECTIVE",
  "ITEM_NOT_RECEIVED",
  "FALSE_CLAIM",
])
