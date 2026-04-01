import * as RD from "../../../Core/Data/RemoteData"
import { Report, ReportStatus } from "../../../Core/App/Report"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as UserListApi from "../Api/Auth/User/Report/ListMine"
import * as SellerListApi from "../Api/Auth/Seller/Report/ListMine"
import * as UserCreateApi from "../Api/Auth/User/Report/Create"
import * as SellerRespondApi from "../Api/Auth/Seller/Report/Respond"
import * as AdminUpdateStatusApi from "../Api/Auth/Admin/Report/UpdateStatus"

export type ReportState = {
  userReports: Report[]
  sellerReports: Report[]
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
  statusDraftByReportID: Record<string, ReportStatus>
  sellerEvidenceDraftByReportID: Record<string, string>
  sellerEvidenceUrlsDraftByReportID: Record<string, string>
  adminResultDraftByReportID: Record<string, string>
  flashMessage: string | null
}

export function initReportState(): ReportState {
  return {
    userReports: [],
    sellerReports: [],
    userReportsResponse: RD.notAsked(),
    sellerReportsResponse: RD.notAsked(),
    createResponse: RD.notAsked(),
    sellerRespondResponse: RD.notAsked(),
    adminUpdateStatusResponse: RD.notAsked(),
    statusDraftByReportID: {},
    sellerEvidenceDraftByReportID: {},
    sellerEvidenceUrlsDraftByReportID: {},
    adminResultDraftByReportID: {},
    flashMessage: null,
  }
}

export function _ReportState(state: State, report: Partial<ReportState>): State {
  return {
    ...state,
    report: { ...state.report, ...report },
  }
}
