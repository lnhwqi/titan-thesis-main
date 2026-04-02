import * as RD from "../../../Core/Data/RemoteData"
import { Report, ReportCategory, ReportStatus } from "../../../Core/App/Report"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as UserListApi from "../Api/Auth/User/Report/ListMine"
import * as SellerListApi from "../Api/Auth/Seller/Report/ListMine"
import * as UserCreateApi from "../Api/Auth/User/Report/Create"
import * as SellerRespondApi from "../Api/Auth/Seller/Report/Respond"
import * as AdminUpdateStatusApi from "../Api/Auth/Admin/Report/UpdateStatus"
import * as AdminListApi from "../Api/Auth/Admin/Report/List"

export type ReportCreateDraft = {
  category: ReportCategory
  userDescription: string
  userUrlImgsRaw: string
}

export type SellerConfirmAction = "SUBMIT_EVIDENCE" | "AGREE_CASHBACK"

export type SellerConfirmState = {
  reportID: string
  action: SellerConfirmAction
} | null

export type UserCreateConfirmState = {
  params: UserCreateApi.BodyParams
} | null

export type AdminStatusFilter = "ALL" | ReportStatus
export type AdminSortOrder = "STATUS_ASC" | "STATUS_DESC"

export type AdminFinalStatusConfirmState = {
  reportID: string
  status: "RESOLVED" | "REJECTED"
} | null

export type ReportState = {
  userReports: Report[]
  sellerReports: Report[]
  adminReports: Report[]
  createDraft: ReportCreateDraft
  userReportsResponse: RD.RemoteData<
    ApiError<UserListApi.ErrorCode>,
    UserListApi.Payload
  >
  sellerReportsResponse: RD.RemoteData<
    ApiError<SellerListApi.ErrorCode>,
    SellerListApi.Payload
  >
  createResponse: RD.RemoteData<
    ApiError<UserCreateApi.ErrorCode>,
    UserCreateApi.Payload
  >
  sellerRespondResponse: RD.RemoteData<
    ApiError<SellerRespondApi.ErrorCode>,
    SellerRespondApi.Payload
  >
  adminUpdateStatusResponse: RD.RemoteData<
    ApiError<AdminUpdateStatusApi.ErrorCode>,
    AdminUpdateStatusApi.Payload
  >
  adminReportsResponse: RD.RemoteData<
    ApiError<AdminListApi.ErrorCode>,
    AdminListApi.Payload
  >
  statusDraftByReportID: Record<string, ReportStatus>
  sellerEvidenceDraftByReportID: Record<string, string>
  sellerEvidenceUrlsDraftByReportID: Record<string, string>
  adminResultDraftByReportID: Record<string, string>
  sellerConfirmState: SellerConfirmState
  userCreateConfirmState: UserCreateConfirmState
  adminStatusFilter: AdminStatusFilter
  adminMonthFilter: "ALL" | string
  adminSortOrder: AdminSortOrder
  adminFinalStatusConfirmState: AdminFinalStatusConfirmState
  flashMessage: string | null
}

export function initReportState(): ReportState {
  return {
    userReports: [],
    sellerReports: [],
    adminReports: [],
    createDraft: {
      category: "WRONG_ITEM",
      userDescription: "",
      userUrlImgsRaw: "",
    },
    userReportsResponse: RD.notAsked(),
    sellerReportsResponse: RD.notAsked(),
    createResponse: RD.notAsked(),
    sellerRespondResponse: RD.notAsked(),
    adminUpdateStatusResponse: RD.notAsked(),
    adminReportsResponse: RD.notAsked(),
    statusDraftByReportID: {},
    sellerEvidenceDraftByReportID: {},
    sellerEvidenceUrlsDraftByReportID: {},
    adminResultDraftByReportID: {},
    sellerConfirmState: null,
    userCreateConfirmState: null,
    adminStatusFilter: "ALL",
    adminMonthFilter: "ALL",
    adminSortOrder: "STATUS_ASC",
    adminFinalStatusConfirmState: null,
    flashMessage: null,
  }
}

export function _ReportState(
  state: State,
  report: Partial<ReportState>,
): State {
  return {
    ...state,
    report: { ...state.report, ...report },
  }
}
