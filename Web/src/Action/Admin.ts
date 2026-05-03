import { SellerID } from "../../../Core/App/Seller/SellerID"
import { CategoryID } from "../../../Core/App/Category/CategoryID"
import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, Cmd, perform } from "../Action"
import * as ListPendingSellersApi from "../Api/Auth/Admin/ListPendingSellers"
import * as ListAllSellersApi from "../Api/Auth/Admin/ListAllSellers"
import * as HomeAdminApi from "../Api/Auth/Admin/Home"
import * as AdminOrderPaymentListApi from "../Api/Auth/Admin/OrderPayment/List"
import * as StatsApi from "../Api/Auth/Admin/Stats"
import * as SupportAIMetricsApi from "../Api/Auth/Admin/SupportAIMetrics"
import * as SupportAIMetricsHistoryApi from "../Api/Auth/Admin/SupportAIMetricsHistory"
import * as ReportWindowGetApi from "../Api/Auth/Admin/ReportWindowGet"
import * as ReportWindowUpdateApi from "../Api/Auth/Admin/ReportWindowUpdate"
import * as ProductRatingReportLimitGetApi from "../Api/Auth/Admin/ProductRatingReportLimitGet"
import * as ProductRatingReportLimitUpdateApi from "../Api/Auth/Admin/ProductRatingReportLimitUpdate"
import * as SellerTierPolicyGetApi from "../Api/Auth/Admin/SellerTierPolicyGet"
import * as SellerTierPolicyUpdateApi from "../Api/Auth/Admin/SellerTierPolicyUpdate"
import * as ApproveSellerApi from "../Api/Auth/Admin/ApproveSeller"
import * as SendSellerVerifyEmailApi from "../Api/Auth/Admin/SendSellerVerifyEmail"
import * as CreateCategoryApi from "../Api/Auth/Admin/CreateCategory"
import * as UpdateCategoryApi from "../Api/Auth/Admin/UpdateCategory"
import * as DeleteCategoryApi from "../Api/Auth/Admin/DeleteCategoryApi"
import * as CategoryAction from "./Category"
import {
  _AdminDashboardState,
  type AdminDashboardState,
} from "../State/AdminDashboard"
import { State } from "../State"
import { createName } from "../../../Core/App/Category/Name"
import { slugify } from "../../../Core/App/Category/Slug"
import { navigateTo, toRoute } from "../Route"

export function onEnterRoute(state: State): [State, Cmd] {
  return loadOverview()(
    _AdminDashboardState(state, {
      reportWindowHours: state.adminDashboard.reportWindowHours,
    }),
  )
}

export function onChangeReportWindowHours(value: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      reportWindowHours: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function saveReportWindowHours(): Action {
  return (state) => {
    const value = Number(state.adminDashboard.reportWindowHours.trim())
    const decoded = ReportWindowUpdateApi.paramsDecoder.decode({
      reportWindowHours: value,
    })

    if (decoded.ok === false) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Invalid report window hours.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        flashMessage: null,
      }),
      cmd(
        ReportWindowUpdateApi.call(decoded.value).then(onReportWindowUpdated),
      ),
    ]
  }
}

export function loadOverview(): Action {
  return (state) => {
    const [nextState, pendingCmd] = loadPendingSellers()(state)
    const historyLimit = state.adminDashboard.supportMonitoringHistoryLimit

    return [
      _AdminDashboardState(nextState, {
        adminHomeResponse: RD.loading(),
        orderPaymentsResponse: RD.loading(),
        allSellersResponse: RD.loading(),
        statsResponse: RD.loading(),
        supportMetricsResponse: RD.loading(),
        supportMetricsHistoryResponse: RD.loading(),
        sellerTierPolicyResponse: RD.loading(),
      }),
      cmd(
        ...pendingCmd,
        HomeAdminApi.call().then(onAdminHomeResponse),
        AdminOrderPaymentListApi.call().then(onOrderPaymentsResponse),
        ListAllSellersApi.call().then(onLoadAllSellersResponse),
        StatsApi.call().then(onStatsResponse),
        SupportAIMetricsApi.call().then(onSupportMetricsResponse),
        SupportAIMetricsHistoryApi.call({
          limit: historyLimit,
        }).then(onSupportMetricsHistoryResponse),
        ReportWindowGetApi.call().then(onReportWindowLoaded),
        ProductRatingReportLimitGetApi.call().then(onRatingReportLimitLoaded),
        SellerTierPolicyGetApi.call().then(onSellerTierPolicyGetResponse),
      ),
    ]
  }
}

export function onChangeSupportMonitoringRange(
  range: AdminDashboardState["supportMonitoringRange"],
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      supportMonitoringRange: range,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeDashboardAnalyticsTab(
  tab: AdminDashboardState["dashboardAnalyticsTab"],
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      dashboardAnalyticsTab: tab,
    }),
    cmd(),
  ]
}

export function onChangeSupportMonitoringHistoryLimit(
  limit: AdminDashboardState["supportMonitoringHistoryLimit"],
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      supportMonitoringHistoryLimit: limit,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function reloadSupportMonitoringData(): Action {
  return (state) => {
    const limit = state.adminDashboard.supportMonitoringHistoryLimit

    return [
      _AdminDashboardState(state, {
        supportMetricsResponse: RD.loading(),
        supportMetricsHistoryResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        SupportAIMetricsApi.call().then(onSupportMetricsResponse),
        SupportAIMetricsHistoryApi.call({ limit }).then(
          onSupportMetricsHistoryResponse,
        ),
      ),
    ]
  }
}

function onReportWindowLoaded(response: ReportWindowGetApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [state, cmd()]
    }

    return [
      _AdminDashboardState(state, {
        reportWindowHours: String(response.value.reportWindowHours.unwrap()),
      }),
      cmd(),
    ]
  }
}

function onReportWindowUpdated(
  response: ReportWindowUpdateApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          flashMessage: ReportWindowUpdateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const saved = response.value.reportWindowHours.unwrap()

    return [
      _AdminDashboardState(state, {
        reportWindowHours: String(saved),
        flashMessage: `Report button window is now ${saved} hour(s).`,
      }),
      cmd(),
    ]
  }
}

export function onChangeRatingReportMaxPerDay(value: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      ratingReportMaxPerDay: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function saveRatingReportMaxPerDay(): Action {
  return (state) => {
    const value = Number(state.adminDashboard.ratingReportMaxPerDay.trim())
    const decoded = ProductRatingReportLimitUpdateApi.paramsDecoder.decode({
      ratingReportMaxPerDay: value,
    })

    if (decoded.ok === false) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Invalid rating report limit per day.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        flashMessage: null,
      }),
      cmd(
        ProductRatingReportLimitUpdateApi.call(decoded.value).then(
          onRatingReportLimitUpdated,
        ),
      ),
    ]
  }
}

function onRatingReportLimitLoaded(
  response: ProductRatingReportLimitGetApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [state, cmd()]
    }

    return [
      _AdminDashboardState(state, {
        ratingReportMaxPerDay: String(
          response.value.ratingReportMaxPerDay.unwrap(),
        ),
      }),
      cmd(),
    ]
  }
}

function onRatingReportLimitUpdated(
  response: ProductRatingReportLimitUpdateApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          flashMessage: ProductRatingReportLimitUpdateApi.errorString(
            response.error,
          ),
        }),
        cmd(),
      ]
    }

    const saved = response.value.ratingReportMaxPerDay.unwrap()

    return [
      _AdminDashboardState(state, {
        ratingReportMaxPerDay: String(saved),
        flashMessage: `Seller rating-report limit is now ${saved} per day.`,
      }),
      cmd(),
    ]
  }
}

export function loadSellerTierPolicy(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      sellerTierPolicyResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(SellerTierPolicyGetApi.call().then(onSellerTierPolicyGetResponse)),
  ]
}

export function onChangeSellerTierPolicyInput(
  field:
    | "silverProfitThresholdInput"
    | "goldProfitThresholdInput"
    | "bronzeTaxInput"
    | "silverTaxInput"
    | "goldTaxInput",
  value: string,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      [field]: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function saveSellerTierPolicy(): Action {
  return (state) => {
    const silverProfitThreshold = Number(
      state.adminDashboard.silverProfitThresholdInput.trim(),
    )
    const goldProfitThreshold = Number(
      state.adminDashboard.goldProfitThresholdInput.trim(),
    )
    const bronzeTax = Number(state.adminDashboard.bronzeTaxInput.trim())
    const silverTax = Number(state.adminDashboard.silverTaxInput.trim())
    const goldTax = Number(state.adminDashboard.goldTaxInput.trim())

    const decoded = SellerTierPolicyUpdateApi.paramsDecoder.decode({
      silverProfitThreshold,
      goldProfitThreshold,
      bronzeTax,
      silverTax,
      goldTax,
    })

    if (decoded.ok === false) {
      return [
        _AdminDashboardState(state, {
          flashMessage:
            "Invalid tier policy input. Use integers for thresholds and 0-100 for tax.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        isSavingSellerTierPolicy: true,
        flashMessage: null,
      }),
      cmd(
        SellerTierPolicyUpdateApi.call(decoded.value).then(
          onSellerTierPolicyUpdateResponse,
        ),
      ),
    ]
  }
}

export function loadOrderPayments(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      orderPaymentsResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(AdminOrderPaymentListApi.call().then(onOrderPaymentsResponse)),
  ]
}

export function onEnterCategoryManagementRoute(state: State): [State, Cmd] {
  return reloadCategoryTree()(
    _AdminDashboardState(state, {
      flashMessage: null,
    }),
  )
}

export function reloadCategoryTree(): Action {
  return (state) => CategoryAction.loadTree()(state)
}

export function loadPendingSellers(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      pendingSellersResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(ListPendingSellersApi.call().then(onLoadPendingResponse)),
  ]
}

function onLoadPendingResponse(
  response: ListPendingSellersApi.Response,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      pendingSellersResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

export function loadAllSellers(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      allSellersResponse: RD.loading(),
      flashMessage: null,
    }),
    cmd(ListAllSellersApi.call().then(onLoadAllSellersResponse)),
  ]
}

function onLoadAllSellersResponse(
  response: ListAllSellersApi.Response,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      allSellersResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

export function changeSellerModerationFilter(
  filter:
    | "revenue-high"
    | "revenue-low"
    | "profit-high"
    | "profit-low"
    | "none",
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      sellerModerationFilter: filter,
    }),
    cmd(),
  ]
}

function onAdminHomeResponse(response: HomeAdminApi.Response): Action {
  return (state) => [
    _AdminDashboardState(state, {
      adminHomeResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function onOrderPaymentsResponse(
  response: AdminOrderPaymentListApi.Response,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      orderPaymentsResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function onStatsResponse(response: StatsApi.Response): Action {
  return (state) => [
    _AdminDashboardState(state, {
      statsResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function onSupportMetricsResponse(
  response: SupportAIMetricsApi.Response,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      supportMetricsResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function onSupportMetricsHistoryResponse(
  response: SupportAIMetricsHistoryApi.Response,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      supportMetricsHistoryResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function onSellerTierPolicyGetResponse(
  response: SellerTierPolicyGetApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          sellerTierPolicyResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    const policy = response.value.sellerTierPolicy

    return [
      _AdminDashboardState(state, {
        sellerTierPolicyResponse: RD.success(response.value),
        silverProfitThresholdInput: String(
          policy.silverProfitThreshold.unwrap(),
        ),
        goldProfitThresholdInput: String(policy.goldProfitThreshold.unwrap()),
        bronzeTaxInput: String(policy.bronzeTax.unwrap()),
        silverTaxInput: String(policy.silverTax.unwrap()),
        goldTaxInput: String(policy.goldTax.unwrap()),
      }),
      cmd(),
    ]
  }
}

function onSellerTierPolicyUpdateResponse(
  response: SellerTierPolicyUpdateApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          isSavingSellerTierPolicy: false,
          flashMessage: SellerTierPolicyUpdateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const policy = response.value.sellerTierPolicy

    return [
      _AdminDashboardState(state, {
        isSavingSellerTierPolicy: false,
        sellerTierPolicyResponse: RD.success(response.value),
        silverProfitThresholdInput: String(
          policy.silverProfitThreshold.unwrap(),
        ),
        goldProfitThresholdInput: String(policy.goldProfitThreshold.unwrap()),
        bronzeTaxInput: String(policy.bronzeTax.unwrap()),
        silverTaxInput: String(policy.silverTax.unwrap()),
        goldTaxInput: String(policy.goldTax.unwrap()),
        flashMessage: "Seller tier policy updated.",
      }),
      cmd(),
    ]
  }
}

export function approveSeller(sellerID: SellerID): Action {
  return (state) => {
    const id = sellerID.unwrap()
    const next = state.adminDashboard.approvingSellerIDs.includes(id)
      ? state.adminDashboard.approvingSellerIDs
      : [...state.adminDashboard.approvingSellerIDs, id]

    return [
      _AdminDashboardState(state, {
        approvingSellerIDs: next,
        flashMessage: null,
      }),
      cmd(
        ApproveSellerApi.call({ sellerID }).then((res) =>
          onApproveResponse(id, res),
        ),
      ),
    ]
  }
}

export function sendVerifyEmail(sellerID: SellerID): Action {
  return (state) => {
    const id = sellerID.unwrap()
    const next = state.adminDashboard.sendingVerifyEmailSellerIDs.includes(id)
      ? state.adminDashboard.sendingVerifyEmailSellerIDs
      : [...state.adminDashboard.sendingVerifyEmailSellerIDs, id]

    return [
      _AdminDashboardState(state, {
        sendingVerifyEmailSellerIDs: next,
        flashMessage: null,
      }),
      cmd(
        SendSellerVerifyEmailApi.call({ sellerID }).then((res) =>
          onSendVerifyEmailResponse(id, res),
        ),
      ),
    ]
  }
}

function onSendVerifyEmailResponse(
  sellerID: string,
  response: SendSellerVerifyEmailApi.Response,
): Action {
  return (state) => {
    const sendingVerifyEmailSellerIDs =
      state.adminDashboard.sendingVerifyEmailSellerIDs.filter(
        (x) => x !== sellerID,
      )

    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          sendingVerifyEmailSellerIDs,
          flashMessage: SendSellerVerifyEmailApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        sendingVerifyEmailSellerIDs,
        flashMessage:
          "Verification email sent to seller. After confirmation, click Approve Seller.",
      }),
      cmd(),
    ]
  }
}

function onApproveResponse(
  sellerID: string,
  response: ApproveSellerApi.Response,
): Action {
  return (state) => {
    const approvingSellerIDs = state.adminDashboard.approvingSellerIDs.filter(
      (x) => x !== sellerID,
    )

    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          approvingSellerIDs,
          flashMessage: ApproveSellerApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const current = state.adminDashboard.pendingSellersResponse

    if (current._t !== "Success") {
      return [
        _AdminDashboardState(state, {
          approvingSellerIDs,
          flashMessage:
            "Seller approved. You can now send verification email via your mail service.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        approvingSellerIDs,
        pendingSellersResponse: RD.success({
          sellers: current.data.sellers.filter(
            (seller) => seller.id.unwrap() !== sellerID,
          ),
        }),
        flashMessage:
          "Seller approved. You can now send verification email via your mail service.",
      }),
      cmd(),
    ]
  }
}

export function onChangeCategoryRootName(value: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryRootName: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function submitCreateRootCategory(): Action {
  return (state) => {
    const nameRaw = state.adminDashboard.categoryRootName.trim()
    const name = createName(nameRaw)
    const slug = slugify(nameRaw)

    if (nameRaw === "" || name == null || slug == null) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Root category name is invalid.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        creatingCategoryResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        CreateCategoryApi.call({
          name,
          slug,
          parentID: null,
        }).then((response) => onCreateCategoryResponse("root", response)),
      ),
    ]
  }
}

export function selectParentForChild(
  parentID: CategoryID,
  parentName: string,
): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryChildParentID: parentID,
      categoryChildParentName: parentName,
      categoryChildName: "",
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function clearParentForChild(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryChildParentID: null,
      categoryChildParentName: null,
      categoryChildName: "",
    }),
    cmd(),
  ]
}

export function onChangeCategoryChildName(value: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryChildName: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function submitCreateChildCategory(): Action {
  return (state) => {
    const parentID = state.adminDashboard.categoryChildParentID
    const nameRaw = state.adminDashboard.categoryChildName.trim()
    const name = createName(nameRaw)
    const slug = slugify(nameRaw)

    if (parentID == null) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Select a parent category first.",
        }),
        cmd(),
      ]
    }

    if (nameRaw === "" || name == null || slug == null) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Child category name is invalid.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        creatingCategoryResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        CreateCategoryApi.call({
          name,
          slug,
          parentID,
        }).then((response) => onCreateCategoryResponse("child", response)),
      ),
    ]
  }
}

type CreateMode = "root" | "child"

function onCreateCategoryResponse(
  mode: CreateMode,
  response: CreateCategoryApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          creatingCategoryResponse: RD.failure(response.error),
          flashMessage: CreateCategoryApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const message =
      mode === "root"
        ? `Root category \"${response.value.category.name.unwrap()}\" created.`
        : `Child category \"${response.value.category.name.unwrap()}\" created.`

    const [nextState, loadTreeCmd] = CategoryAction.loadTree()(
      _AdminDashboardState(state, {
        creatingCategoryResponse: RD.success(response.value),
        categoryRootName:
          mode === "root" ? "" : state.adminDashboard.categoryRootName,
        categoryChildName:
          mode === "child" ? "" : state.adminDashboard.categoryChildName,
        flashMessage: message,
      }),
    )

    return [nextState, loadTreeCmd]
  }
}

export function startEditCategory(id: CategoryID, currentName: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryEditID: id,
      categoryEditName: currentName,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function cancelEditCategory(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryEditID: null,
      categoryEditName: "",
    }),
    cmd(),
  ]
}

export function onChangeEditCategoryName(value: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      categoryEditName: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function submitEditCategory(): Action {
  return (state) => {
    const id = state.adminDashboard.categoryEditID
    const nameRaw = state.adminDashboard.categoryEditName.trim()
    const name = createName(nameRaw)
    const slug = slugify(nameRaw)

    if (id == null) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Choose a category to edit.",
        }),
        cmd(),
      ]
    }

    if (nameRaw === "" || name == null || slug == null) {
      return [
        _AdminDashboardState(state, {
          flashMessage: "Edited category name is invalid.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminDashboardState(state, {
        updatingCategoryResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        UpdateCategoryApi.call({ id }, { name, slug }).then(
          onUpdateCategoryResponse,
        ),
      ),
    ]
  }
}

export function requestDeleteCategory(id: CategoryID, name: string): Action {
  return (state) => [
    _AdminDashboardState(state, {
      deleteCategoryTarget: { id, name },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function cancelDeleteCategory(): Action {
  return (state) => [
    _AdminDashboardState(state, {
      deleteCategoryTarget: null,
    }),
    cmd(),
  ]
}

export function confirmDeleteCategory(): Action {
  return (state) => {
    const target = state.adminDashboard.deleteCategoryTarget
    if (target == null) {
      return [state, cmd()]
    }

    return deleteCategory(
      target.id,
      target.name,
    )(
      _AdminDashboardState(state, {
        deleteCategoryTarget: null,
      }),
    )
  }
}

export function deleteCategory(id: CategoryID, name: string): Action {
  return (state) => {
    const idRaw = id.unwrap()
    const deletingCategoryIDs =
      state.adminDashboard.deletingCategoryIDs.includes(idRaw)
        ? state.adminDashboard.deletingCategoryIDs
        : [...state.adminDashboard.deletingCategoryIDs, idRaw]

    return [
      _AdminDashboardState(state, {
        deletingCategoryIDs,
        flashMessage: null,
        deleteCategoryTarget: null,
      }),
      cmd(
        DeleteCategoryApi.call({ id }).then((response) =>
          onDeleteCategoryResponse(idRaw, name, response),
        ),
      ),
    ]
  }
}

function onDeleteCategoryResponse(
  id: string,
  name: string,
  response: DeleteCategoryApi.Response,
): Action {
  return (state) => {
    const deletingCategoryIDs = state.adminDashboard.deletingCategoryIDs.filter(
      (item) => item !== id,
    )

    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          deletingCategoryIDs,
          flashMessage: DeleteCategoryApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const shouldClearChildParent =
      state.adminDashboard.categoryChildParentID?.unwrap() === id
    const shouldClearEdit = state.adminDashboard.categoryEditID?.unwrap() === id

    const [nextState, loadTreeCmd] = CategoryAction.loadTree()(
      _AdminDashboardState(state, {
        deletingCategoryIDs,
        categoryChildParentID: shouldClearChildParent
          ? null
          : state.adminDashboard.categoryChildParentID,
        categoryChildParentName: shouldClearChildParent
          ? null
          : state.adminDashboard.categoryChildParentName,
        categoryEditID: shouldClearEdit
          ? null
          : state.adminDashboard.categoryEditID,
        categoryEditName: shouldClearEdit
          ? ""
          : state.adminDashboard.categoryEditName,
        flashMessage: `Category \"${name}\" deleted. If it had children, they were deleted as well.`,
      }),
    )

    return [nextState, loadTreeCmd]
  }
}

function onUpdateCategoryResponse(
  response: UpdateCategoryApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminDashboardState(state, {
          updatingCategoryResponse: RD.failure(response.error),
          flashMessage: UpdateCategoryApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const [nextState, loadTreeCmd] = CategoryAction.loadTree()(
      _AdminDashboardState(state, {
        updatingCategoryResponse: RD.success(response.value),
        categoryEditID: null,
        categoryEditName: "",
        flashMessage: `Category \"${response.value.category.name.unwrap()}\" updated.`,
      }),
    )

    return [nextState, loadTreeCmd]
  }
}

export function clearFlashMessage(): Action {
  return (state) => [_AdminDashboardState(state, { flashMessage: null }), cmd()]
}

export function goToAdminDashboard(): Action {
  return (state) => [
    state,
    cmd(perform(navigateTo(toRoute("AdminDashboard", {})))),
  ]
}
