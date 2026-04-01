import * as JD from "decoders"
import { ReportCategory } from "./ReportCategory"

export type ReportTitle =
  | "Wrong Product"
  | "Defective Product"
  | "Item Not Received"
  | "False Claim"

export const reportTitleDecoder: JD.Decoder<ReportTitle> = JD.oneOf([
  "Wrong Product",
  "Defective Product",
  "Item Not Received",
  "False Claim",
])

export function reportTitleFromCategory(category: ReportCategory): ReportTitle {
  switch (category) {
    case "WRONG_ITEM":
      return "Wrong Product"
    case "DEFECTIVE":
      return "Defective Product"
    case "ITEM_NOT_RECEIVED":
      return "Item Not Received"
    case "FALSE_CLAIM":
      return "False Claim"
  }
}

export function isReportTitleMatchingCategory(
  category: ReportCategory,
  title: ReportTitle,
): boolean {
  return reportTitleFromCategory(category) === title
}
