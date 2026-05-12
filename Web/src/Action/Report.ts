import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _ReportState, SellerConfirmAction } from "../State/Report"
import * as UserListApi from "../Api/Auth/User/Report/ListMine"
import * as SellerListApi from "../Api/Auth/Seller/Report/ListMine"
import * as UserCreateApi from "../Api/Auth/User/Report/Create"
import * as SellerRespondApi from "../Api/Auth/Seller/Report/Respond"
import * as AdminUpdateStatusApi from "../Api/Auth/Admin/Report/UpdateStatus"
import * as AdminListApi from "../Api/Auth/Admin/Report/List"
import {
  parseReportID,
  createSellerDescription,
  createResultTextAdmin,
  ReportStatus,
  ReportCategory,
  type ReportID,
} from "../../../Core/App/Report"
import { createSellerUrlImgs } from "../../../Core/App/Report/SellerUrlImgs"
import { navigateTo, toRoute } from "../Route"

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

export function onEnterAdminReportsRoute(): Action {
  return (state) => [
    _ReportState(state, {
      adminReportsResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(AdminListApi.call().then(onAdminListResponse)),
  ]
}

export function resetCreateDraft(): Action {
  return (state) => [
    _ReportState(state, {
      createDraft: {
        category: "WRONG_ITEM",
        userDescription: "",
        userUrlImgsRaw: "",
      },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeCreateDraftCategory(category: ReportCategory): Action {
  return (state) => [
    _ReportState(state, {
      createDraft: { ...state.report.createDraft, category },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeCreateDraftDescription(value: string): Action {
  return (state) => [
    _ReportState(state, {
      createDraft: { ...state.report.createDraft, userDescription: value },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeCreateDraftUrls(value: string): Action {
  return (state) => [
    _ReportState(state, {
      createDraft: { ...state.report.createDraft, userUrlImgsRaw: value },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function setFlashMessage(message: string | null): Action {
  return (state) => [_ReportState(state, { flashMessage: message }), cmd()]
}

export function openUserCreateConfirm(
  params: UserCreateApi.BodyParams,
): Action {
  return (state) => [
    _ReportState(state, {
      userCreateConfirmState: { params },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function closeUserCreateConfirm(): Action {
  return (state) => [
    _ReportState(state, { userCreateConfirmState: null }),
    cmd(),
  ]
}

export function confirmUserCreateReport(): Action {
  return (state) => {
    const confirmState = state.report.userCreateConfirmState
    if (confirmState == null) {
      return [state, cmd()]
    }

    return submitUserReport(confirmState.params)(
      _ReportState(state, { userCreateConfirmState: null }),
    )
  }
}

export function openSellerConfirmCard(
  reportID: string,
  action: SellerConfirmAction,
): Action {
  return (state) => {
    if (action === "AGREE_CASHBACK") {
      const report = state.report.sellerReports.find(
        (item) => item.id.unwrap() === reportID,
      )

      if (
        report == null ||
        canSellerAgreeCashbackByStatus(report.status) === false
      ) {
        return [
          _ReportState(state, {
            flashMessage:
              "Cashback can no longer be agreed for this report status.",
            sellerConfirmState: null,
          }),
          cmd(),
        ]
      }
    }

    return [
      _ReportState(state, {
        sellerConfirmState: { reportID, action },
        flashMessage: null,
      }),
      cmd(),
    ]
  }
}

export function closeSellerConfirmCard(): Action {
  return (state) => [_ReportState(state, { sellerConfirmState: null }), cmd()]
}

export function onChangeAdminStatusFilter(
  filter: "ALL" | ReportStatus,
): Action {
  return (state) => [
    _ReportState(state, {
      adminStatusFilter: filter,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeAdminMonthFilter(month: "ALL" | string): Action {
  return (state) => [
    _ReportState(state, {
      adminMonthFilter: month,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeAdminSortOrder(
  order: "STATUS_ASC" | "STATUS_DESC",
): Action {
  return (state) => [
    _ReportState(state, {
      adminSortOrder: order,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function openAdminFinalStatusConfirm(
  reportID: string,
  status: "RESOLVED" | "REJECTED",
): Action {
  return (state) => [
    _ReportState(state, {
      adminFinalStatusConfirmState: { reportID, status },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function closeAdminFinalStatusConfirm(): Action {
  return (state) => [
    _ReportState(state, { adminFinalStatusConfirmState: null }),
    cmd(),
  ]
}

export function confirmAdminFinalStatus(): Action {
  return (state) => {
    const confirmState = state.report.adminFinalStatusConfirmState
    if (confirmState == null) {
      return [state, cmd()]
    }

    return submitAdminUpdateStatusInternal(
      confirmState.reportID,
      true,
    )(_ReportState(state, { adminFinalStatusConfirmState: null }))
  }
}

export function confirmSellerAction(): Action {
  return (state) => {
    const confirmState = state.report.sellerConfirmState
    if (confirmState == null) {
      return [state, cmd()]
    }

    return confirmState.action === "SUBMIT_EVIDENCE"
      ? submitSellerEvidence(confirmState.reportID)(
          _ReportState(state, { sellerConfirmState: null }),
        )
      : approveSellerRefund(confirmState.reportID)(
          _ReportState(state, { sellerConfirmState: null }),
        )
  }
}

export function submitUserReport(params: UserCreateApi.BodyParams): Action {
  return (state) => [
    _ReportState(state, {
      createResponse: RD.loading(),
      userCreateConfirmState: null,
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
    const parsedID = parseReportIDOrNull(reportID)
    if (parsedID == null) {
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
    const current = state.report.sellerReports.find(
      (item) => item.id.unwrap() === reportID,
    )

    if (
      current == null ||
      canSellerAgreeCashbackByStatus(current.status) === false
    ) {
      return [
        _ReportState(state, {
          flashMessage:
            "Cashback can no longer be agreed for this report status.",
        }),
        cmd(),
      ]
    }

    const parsedID = parseReportIDOrNull(reportID)
    if (parsedID == null) {
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

function canSellerAgreeCashbackByStatus(status: ReportStatus): boolean {
  return (
    status === "OPEN" ||
    status === "SELLER_REPLIED" ||
    status === "UNDER_REVIEW"
  )
}

export function submitAdminUpdateStatus(reportID: string): Action {
  return submitAdminUpdateStatusInternal(reportID, false)
}

function submitAdminUpdateStatusInternal(
  reportID: string,
  bypassFinalConfirm = false,
): Action {
  return (state) => {
    const current = state.report.adminReports.find(
      (item) => item.id.unwrap() === reportID,
    )
    if (current == null) {
      return [_ReportState(state, { flashMessage: "Report not found." }), cmd()]
    }

    if (isAdminReportClosed(current.status)) {
      return [
        _ReportState(state, {
          flashMessage: "Rejected/Resolved reports cannot be edited anymore.",
        }),
        cmd(),
      ]
    }

    const parsedID = parseReportIDOrNull(reportID)
    if (parsedID == null) {
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

    if (
      bypassFinalConfirm === false &&
      (nextStatus === "RESOLVED" || nextStatus === "REJECTED")
    ) {
      return [
        _ReportState(state, {
          adminFinalStatusConfirmState: {
            reportID,
            status: nextStatus,
          },
          flashMessage: null,
        }),
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
        adminFinalStatusConfirmState: null,
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

function isAdminReportClosed(status: ReportStatus): boolean {
  return (
    status === "RESOLVED" ||
    status === "REJECTED" ||
    status === "CASHBACK_COMPLETED"
  )
}

function parseReportIDOrNull(value: string): ReportID | null {
  try {
    return parseReportID(value)
  } catch (_e) {
    return null
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

    const [nextStatusDraft, nextAdminResultDraft] =
      response.value.reports.reduce<
        [Record<string, ReportStatus>, Record<string, string>]
      >(
        ([statusDraft, adminResultDraft], report) => {
          const key = report.id.unwrap()
          return [
            {
              ...statusDraft,
              [key]: report.status,
            },
            {
              ...adminResultDraft,
              [key]: report.resultTextAdmin?.unwrap() ?? "",
            },
          ]
        },
        [
          { ...state.report.statusDraftByReportID },
          { ...state.report.adminResultDraftByReportID },
        ],
      )

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
        createDraft: {
          category: "WRONG_ITEM",
          userDescription: "",
          userUrlImgsRaw: "",
        },
        flashMessage: "Report submitted successfully.",
      }),
      cmd(
        UserListApi.call().then(onUserListResponse),
        perform(navigateTo(toRoute("UserOrders", {}))),
      ),
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
      cmd(AdminListApi.call().then(onAdminListResponse)),
    ]
  }
}

function onAdminListResponse(response: AdminListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ReportState(state, {
          adminReportsResponse: RD.failure(response.error),
          flashMessage: AdminListApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const [nextStatusDraft, nextAdminResultDraft] =
      response.value.reports.reduce<
        [Record<string, ReportStatus>, Record<string, string>]
      >(
        ([statusDraft, adminResultDraft], report) => {
          const key = report.id.unwrap()
          return [
            {
              ...statusDraft,
              [key]: report.status,
            },
            {
              ...adminResultDraft,
              [key]: report.resultTextAdmin?.unwrap() ?? "",
            },
          ]
        },
        [
          { ...state.report.statusDraftByReportID },
          { ...state.report.adminResultDraftByReportID },
        ],
      )

    return [
      _ReportState(state, {
        adminReportsResponse: RD.success(response.value),
        adminReports: response.value.reports,
        statusDraftByReportID: nextStatusDraft,
        adminResultDraftByReportID: nextAdminResultDraft,
      }),
      cmd(),
    ]
  }
}
