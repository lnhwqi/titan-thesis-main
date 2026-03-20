import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import * as CreateVoucherApi from "../Api/Auth/Seller/Voucher/Create"
import * as ListVoucherApi from "../Api/Auth/Seller/Voucher/List"
import * as UpdateVoucherApi from "../Api/Auth/Seller/Voucher/Update"
import * as DeleteVoucherApi from "../Api/Auth/Seller/Voucher/Delete"
import { _VoucherState } from "../State/Voucher"
import { navigateTo, toRoute } from "../Route"
import { voucherIDDecoder } from "../../../Core/App/Voucher/VoucherID"

export function onEnterCreateRoute(): Action {
  return (state) => [
    _VoucherState(state, {
      name: "",
      code: "",
      discount: "",
      minOrderValue: "",
      limit: "",
      expiredDate: "",
      listResponse: RD.loading(),
      createResponse: RD.notAsked(),
      updateResponse: RD.notAsked(),
      deleteResponse: RD.notAsked(),
      editVoucherID: null,
      pendingDeleteVoucherID: null,
      flashMessage: null,
    }),
    cmd(ListVoucherApi.call(emptyQueryParams()).then(onListResponse)),
  ]
}

export function reloadVoucherList(): Action {
  return (state) => [
    _VoucherState(state, { listResponse: RD.loading() }),
    cmd(ListVoucherApi.call(emptyQueryParams()).then(onListResponse)),
  ]
}

export function onChangeName(value: string): Action {
  return (state) => [_VoucherState(state, { name: value }), cmd()]
}

export function onChangeCode(value: string): Action {
  return (state) => [_VoucherState(state, { code: value.toUpperCase() }), cmd()]
}

export function onChangeDiscount(value: string): Action {
  return (state) => [_VoucherState(state, { discount: value }), cmd()]
}

export function onChangeMinOrderValue(value: string): Action {
  return (state) => [_VoucherState(state, { minOrderValue: value }), cmd()]
}

export function onChangeLimit(value: string): Action {
  return (state) => [_VoucherState(state, { limit: value }), cmd()]
}

export function onChangeExpiredDate(value: string): Action {
  return (state) => [_VoucherState(state, { expiredDate: value }), cmd()]
}

export function onChangeEditName(value: string): Action {
  return (state) => [_VoucherState(state, { editName: value }), cmd()]
}

export function onChangeEditLimit(value: string): Action {
  return (state) => [_VoucherState(state, { editLimit: value }), cmd()]
}

export function onChangeEditExpiredDate(value: string): Action {
  return (state) => [_VoucherState(state, { editExpiredDate: value }), cmd()]
}

export function onChangeEditActive(active: boolean): Action {
  return (state) => [_VoucherState(state, { editActive: active }), cmd()]
}

export function clearFlashMessage(): Action {
  return (state) => [_VoucherState(state, { flashMessage: null }), cmd()]
}

export function goToSellerDashboard(): Action {
  return (state) => [
    state,
    cmd(perform(navigateTo(toRoute("SellerDashboard", {})))),
  ]
}

export function startEditVoucher(id: string): Action {
  return (state) => {
    const voucher = state.voucher.vouchers.find(
      (item) => item.id.unwrap() === id,
    )
    if (voucher == null) {
      return [
        _VoucherState(state, {
          flashMessage: "Voucher not found.",
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        editVoucherID: voucher.id.unwrap(),
        editName: voucher.name.unwrap(),
        editLimit: String(voucher.limit.unwrap()),
        editExpiredDate: toDateInput(voucher.expiredDate.unwrap()),
        editActive: voucher.active.unwrap(),
        updateResponse: RD.notAsked(),
      }),
      cmd(),
    ]
  }
}

export function cancelEditVoucher(): Action {
  return (state) => [
    _VoucherState(state, {
      editVoucherID: null,
      editName: "",
      editLimit: "",
      editExpiredDate: "",
      editActive: true,
      updateResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function submitUpdateVoucher(): Action {
  return (state) => {
    const id = state.voucher.editVoucherID
    if (id == null) {
      return [state, cmd()]
    }

    const expiredAt = toExpiredTimestamp(state.voucher.editExpiredDate)
    if (expiredAt == null) {
      return [
        _VoucherState(state, {
          flashMessage: "Please select a valid expired date.",
        }),
        cmd(),
      ]
    }

    let voucherID
    try {
      voucherID = voucherIDDecoder.verify(id)
    } catch (_e) {
      return [
        _VoucherState(state, {
          flashMessage: "Invalid voucher id.",
        }),
        cmd(),
      ]
    }

    const decodeUrl = UpdateVoucherApi.urlParamsDecoder.decode({
      id: voucherID,
    })
    const decodeBody = UpdateVoucherApi.bodyParamsDecoder.decode({
      name: state.voucher.editName,
      limit: Number(state.voucher.editLimit),
      expiredDate: expiredAt,
      active: state.voucher.editActive,
    })

    if (decodeUrl.ok === false || decodeBody.ok === false) {
      return [
        _VoucherState(state, {
          flashMessage: "Invalid update input. Please check all fields.",
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        updateResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        UpdateVoucherApi.call(decodeUrl.value, decodeBody.value).then(
          onUpdateResponse,
        ),
      ),
    ]
  }
}

export function requestDeleteVoucher(id: string): Action {
  return (state) => [
    _VoucherState(state, {
      pendingDeleteVoucherID: id,
      deleteResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function cancelDeleteVoucher(): Action {
  return (state) => [
    _VoucherState(state, {
      pendingDeleteVoucherID: null,
      deleteResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function confirmDeleteVoucher(): Action {
  return (state) => {
    const id = state.voucher.pendingDeleteVoucherID
    if (id == null) {
      return [state, cmd()]
    }

    let voucherID
    try {
      voucherID = voucherIDDecoder.verify(id)
    } catch (_e) {
      return [
        _VoucherState(state, {
          flashMessage: "Invalid voucher id.",
          pendingDeleteVoucherID: null,
        }),
        cmd(),
      ]
    }

    const decode = DeleteVoucherApi.paramsDecoder.decode({ id: voucherID })
    if (decode.ok === false) {
      return [
        _VoucherState(state, {
          flashMessage: "Invalid voucher id.",
          pendingDeleteVoucherID: null,
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        deleteResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(DeleteVoucherApi.call(decode.value).then(onDeleteResponse)),
    ]
  }
}

export function submitCreateVoucher(): Action {
  return (state) => {
    const expiredAt = toExpiredTimestamp(state.voucher.expiredDate)
    if (expiredAt == null) {
      return [
        _VoucherState(state, {
          createResponse: RD.notAsked(),
          flashMessage: "Please select a valid expired date.",
        }),
        cmd(),
      ]
    }

    const discount = Number(state.voucher.discount)
    const minOrderValue = Number(state.voucher.minOrderValue)
    const limit = Number(state.voucher.limit)

    const decodeResult = CreateVoucherApi.paramsDecoder.decode({
      name: state.voucher.name,
      code: state.voucher.code,
      discount,
      minOrderValue,
      limit,
      expiredDate: expiredAt,
    })

    if (decodeResult.ok === false) {
      return [
        _VoucherState(state, {
          createResponse: RD.notAsked(),
          flashMessage: "Invalid voucher input. Please check all fields.",
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        createResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(CreateVoucherApi.call(decodeResult.value).then(onCreateResponse)),
    ]
  }
}

function onCreateResponse(response: CreateVoucherApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _VoucherState(state, {
          createResponse: RD.failure(response.error),
          flashMessage: CreateVoucherApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        createResponse: RD.success(response.value),
        name: "",
        code: "",
        discount: "",
        minOrderValue: "",
        limit: "",
        expiredDate: "",
        flashMessage: "Voucher created successfully.",
      }),
      cmd(ListVoucherApi.call(emptyQueryParams()).then(onListResponse)),
    ]
  }
}

function onListResponse(response: ListVoucherApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _VoucherState(state, {
          listResponse: RD.failure(response.error),
          flashMessage: ListVoucherApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        vouchers: response.value.vouchers,
        listResponse: RD.success(response.value),
      }),
      cmd(),
    ]
  }
}

function onUpdateResponse(response: UpdateVoucherApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _VoucherState(state, {
          updateResponse: RD.failure(response.error),
          flashMessage: UpdateVoucherApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        updateResponse: RD.success(response.value),
        editVoucherID: null,
        editName: "",
        editLimit: "",
        editExpiredDate: "",
        editActive: true,
        flashMessage: "Voucher updated successfully.",
      }),
      cmd(ListVoucherApi.call(emptyQueryParams()).then(onListResponse)),
    ]
  }
}

function onDeleteResponse(response: DeleteVoucherApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _VoucherState(state, {
          deleteResponse: RD.failure(response.error),
          flashMessage: DeleteVoucherApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _VoucherState(state, {
        deleteResponse: RD.success(response.value),
        pendingDeleteVoucherID: null,
        flashMessage: "Voucher deleted successfully.",
      }),
      cmd(ListVoucherApi.call(emptyQueryParams()).then(onListResponse)),
    ]
  }
}

function emptyQueryParams(): ListVoucherApi.QueryParams {
  return {
    minDiscount: null,
    maxDiscount: null,
    isExpired: null,
  }
}

function toExpiredTimestamp(dateInput: string): number | null {
  if (dateInput.trim() === "") {
    return null
  }

  const endOfDay = new Date(`${dateInput}T23:59:59.999`)
  const timestamp = endOfDay.getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

function toDateInput(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
