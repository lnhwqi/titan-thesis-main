import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import { _ReportState } from "../State/Report"
import * as UserListApi from "../Api/Auth/User/Report/ListMine"
import * as SellerListApi from "../Api/Auth/Seller/Report/ListMine"
import * as UserCreateApi from "../Api/Auth/User/Report/Create"
import * as SellerRespondApi from "../Api/Auth/Seller/Report/Respond"
import * as AdminUpdateStatusApi from "../Api/Auth/Admin/Report/UpdateStatus"
import {
  parseReportID,
  createSellerDescription,
  createResultTextAdmin,
  ReportStatus,
} from "../../../Core/App/Report"
import { createSellerUrlImgs } from "../../../Core/App/Report/SellerUrlImgs"

export function clearFlashMessage(): Action {
  return (state) => [_ReportState(state, { flashMessage: null }), cmd()]
}

export function onEnterUserReportsRoute(): Action {
  return (state) => [
    _ReportState(state, {
      userReportsResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(UserListApi.call().then(onUserListResponse)),
  ]
}

export function onEnterSellerReportsRoute(): Action {
  return (state) => [
    _ReportState(state, {
      sellerReportsResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(SellerListApi.call().then(onSellerListResponse)),
  ]
}

export function submitUserReport(params: UserCreateApi.BodyParams): Action {
  return (state) => [
    _ReportState(state, {
      createResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(UserCreateApi.call(params).then(onCreateResponse)),
  ]
}

export function onChangeStatusDraft(
  reportID: string,
  status: ReportStatus,
): Action {
  return (state) => [
    _ReportState(state, {
      statusDraftByReportID: {
        ...state.report.statusDraftByReportID,
        [reportID]: status,
      },
    }),
    cmd(),
  ]
}

export function onChangeSellerEvidenceDraft(
  reportID: string,
  value: string,
): Action {
  return (state) => [
    _ReportState(state, {
      sellerEvidenceDraftByReportID: {
        ...state.report.sellerEvidenceDraftByReportID,
        [reportID]: value,
      },
    }),
    cmd(),
  ]
}

export function onChangeSellerEvidenceUrlsDraft(
  reportID: string,
  value: string,
): Action {
  return (state) => [
    _ReportState(state, {
      sellerEvidenceUrlsDraftByReportID: {
        ...state.report.sellerEvidenceUrlsDraftByReportID,
        [reportID]: value,
      },
    }),
    cmd(),
  ]
}

export function onChangeAdminResultDraft(
  reportID: string,
  value: string,
): Action {
  return (state) => [
    _ReportState(state, {
      adminResultDraftByReportID: {
        ...state.report.adminResultDraftByReportID,
        [reportID]: value,
      },
    }),
    cmd(),
  ]
}

export function submitSellerEvidence(reportID: string): Action {
  return (state) => {
    let parsedID
    try {
      parsedID = parseReportID(reportID)
    } catch (_e) {
      return [
        _ReportState(state, { flashMessage: "Invalid report id." }),
        cmd(),
      ]
    }

    const rawDescription = (
      state.report.sellerEvidenceDraftByReportID[reportID] ?? ""
    ).trim()
    const description =
      rawDescription === "" ? null : createSellerDescription(rawDescription)

    if (rawDescription !== "" && description == null) {
      return [
        _ReportState(state, { flashMessage: "Invalid seller description." }),
        cmd(),
      ]
    }

    const rawUrls = (
      state.report.sellerEvidenceUrlsDraftByReportID[reportID] ?? ""
    )
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter((v) => v !== "")

    const urls = createSellerUrlImgs(rawUrls)
    if (urls == null) {
      return [
        _ReportState(state, {
          flashMessage: "Invalid seller evidence image URLs.",
        }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        sellerRespondResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        SellerRespondApi.call(
          { id: parsedID },
          {
            action: "SUBMIT_EVIDENCE",
            sellerDescription: description,
            sellerUrlImgs: urls,
          },
        ).then(onSellerRespondResponse),
      ),
    ]
  }
}

export function approveSellerRefund(reportID: string): Action {
  return (state) => {
    let parsedID
    try {
      parsedID = parseReportID(reportID)
    } catch (_e) {
      return [
        _ReportState(state, { flashMessage: "Invalid report id." }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        sellerRespondResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        SellerRespondApi.call(
          { id: parsedID },
          {
            action: "APPROVE_REPORT_REFUND",
            sellerDescription: null,
            sellerUrlImgs: [],
          },
        ).then(onSellerRespondResponse),
      ),
    ]
  }
}

export function submitAdminUpdateStatus(reportID: string): Action {
  return (state) => {
    let parsedID
    try {
      parsedID = parseReportID(reportID)
    } catch (_e) {
      return [
        _ReportState(state, { flashMessage: "Invalid report id." }),
        cmd(),
      ]
    }

    const nextStatus = state.report.statusDraftByReportID[reportID]
    if (nextStatus == null) {
      return [
        _ReportState(state, { flashMessage: "Please select report status." }),
        cmd(),
      ]
    }

    const rawResult = (
      state.report.adminResultDraftByReportID[reportID] ?? ""
    ).trim()
    const resultTextAdmin =
      rawResult === "" ? null : createResultTextAdmin(rawResult)

    if (rawResult !== "" && resultTextAdmin == null) {
      return [
        _ReportState(state, { flashMessage: "Invalid admin result text." }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        adminUpdateStatusResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        AdminUpdateStatusApi.call(
          { id: parsedID },
          { status: nextStatus, resultTextAdmin },
        ).then(onAdminUpdateStatusResponse),
      ),
    ]
  }
}

function onUserListResponse(response: UserListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ReportState(state, {
          userReportsResponse: RD.failure(response.error),
          flashMessage: UserListApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        userReportsResponse: RD.success(response.value),
        userReports: response.value.reports,
      }),
      cmd(),
    ]
  }
}

function onSellerListResponse(response: SellerListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ReportState(state, {
          sellerReportsResponse: RD.failure(response.error),
          flashMessage: SellerListApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const nextStatusDraft = { ...state.report.statusDraftByReportID }
    const nextAdminResultDraft = { ...state.report.adminResultDraftByReportID }

    response.value.reports.forEach((report) => {
      const key = report.id.unwrap()
      nextStatusDraft[key] = report.status
      nextAdminResultDraft[key] = report.resultTextAdmin?.unwrap() ?? ""
    })

    return [
      _ReportState(state, {
        sellerReportsResponse: RD.success(response.value),
        sellerReports: response.value.reports,
        statusDraftByReportID: nextStatusDraft,
        adminResultDraftByReportID: nextAdminResultDraft,
      }),
      cmd(),
    ]
  }
}

function onCreateResponse(response: UserCreateApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ReportState(state, {
          createResponse: RD.failure(response.error),
          flashMessage: UserCreateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        createResponse: RD.success(response.value),
        flashMessage: "Report submitted successfully.",
      }),
      cmd(UserListApi.call().then(onUserListResponse)),
    ]
  }
}

function onSellerRespondResponse(response: SellerRespondApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ReportState(state, {
          sellerRespondResponse: RD.failure(response.error),
          flashMessage: SellerRespondApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        sellerRespondResponse: RD.success(response.value),
        flashMessage: "Report response submitted.",
      }),
      cmd(SellerListApi.call().then(onSellerListResponse)),
    ]
  }
}

function onAdminUpdateStatusResponse(
  response: AdminUpdateStatusApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ReportState(state, {
          adminUpdateStatusResponse: RD.failure(response.error),
          flashMessage: AdminUpdateStatusApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ReportState(state, {
        adminUpdateStatusResponse: RD.success(response.value),
        flashMessage: "Report status updated.",
      }),
      cmd(SellerListApi.call().then(onSellerListResponse)),
    ]
  }
}
