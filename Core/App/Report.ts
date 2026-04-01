import * as JD from "decoders"
import { UserID, userIDDecoder } from "./User/UserID"
import { SellerID, sellerIDDecoder } from "./Seller/SellerID"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "./OrderPayment/OrderPaymentID"
import { Maybe, maybeOptionalDecoder } from "../Data/Maybe"
import { ReportID, reportIDDecoder } from "./Report/ReportID"
import { ReportCategory, reportCategoryDecoder } from "./Report/ReportCategory"
import { ReportTitle, reportTitleDecoder } from "./Report/ReportTitle"
import { ReportStatus, reportStatusDecoder } from "./Report/ReportStatus"
import {
  UserDescription,
  userDescriptionDecoder,
} from "./Report/UserDescription"
import {
  SellerDescription,
  sellerDescriptionDecoder,
} from "./Report/SellerDescription"
import {
  ResultTextAdmin,
  resultTextAdminDecoder,
} from "./Report/ResultTextAdmin"
import { UserUrlImgs, userUrlImgsDecoder } from "./Report/UserUrlImgs"
import { SellerUrlImgs, sellerUrlImgsDecoder } from "./Report/SellerUrlImgs"

export type { ReportID } from "./Report/ReportID"
export type { ReportCategory } from "./Report/ReportCategory"
export type { ReportTitle } from "./Report/ReportTitle"
export type { ReportStatus } from "./Report/ReportStatus"
export type { UserDescription } from "./Report/UserDescription"
export type { SellerDescription } from "./Report/SellerDescription"
export type { ResultTextAdmin } from "./Report/ResultTextAdmin"
export type { UserUrlImgs } from "./Report/UserUrlImgs"
export type { SellerUrlImgs } from "./Report/SellerUrlImgs"

export {
  createReportID,
  parseReportID,
  reportIDDecoder,
} from "./Report/ReportID"
export { reportCategoryDecoder } from "./Report/ReportCategory"
export {
  reportTitleDecoder,
  reportTitleFromCategory,
  isReportTitleMatchingCategory,
} from "./Report/ReportTitle"
export { reportStatusDecoder } from "./Report/ReportStatus"
export {
  createUserDescription,
  userDescriptionDecoder,
} from "./Report/UserDescription"
export {
  createSellerDescription,
  sellerDescriptionDecoder,
} from "./Report/SellerDescription"
export {
  createResultTextAdmin,
  resultTextAdminDecoder,
} from "./Report/ResultTextAdmin"
export { userUrlImgsDecoder } from "./Report/UserUrlImgs"
export { sellerUrlImgsDecoder } from "./Report/SellerUrlImgs"

export type Report = {
  id: ReportID
  sellerID: SellerID
  userID: UserID
  orderID: OrderPaymentID
  category: ReportCategory
  title: ReportTitle
  userDescription: UserDescription
  userUrlImgs: UserUrlImgs
  sellerDescription: Maybe<SellerDescription>
  sellerUrlImgs: SellerUrlImgs
  status: ReportStatus
  resultTextAdmin: Maybe<ResultTextAdmin>
}

export const reportDecoder: JD.Decoder<Report> = JD.object({
  id: reportIDDecoder,
  sellerID: sellerIDDecoder,
  userID: userIDDecoder,
  orderID: orderPaymentIDDecoder,
  category: reportCategoryDecoder,
  title: reportTitleDecoder,
  userDescription: userDescriptionDecoder,
  userUrlImgs: userUrlImgsDecoder,
  sellerDescription: maybeOptionalDecoder(sellerDescriptionDecoder),
  sellerUrlImgs: sellerUrlImgsDecoder,
  status: reportStatusDecoder,
  resultTextAdmin: maybeOptionalDecoder(resultTextAdminDecoder),
})
