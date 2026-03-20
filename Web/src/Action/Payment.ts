import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _PaymentState } from "../State/Payment"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as SellerGetProfileApi from "../Api/Public/Seller/GetProfile"
import { _CartState } from "../State/Cart"
import { navigateTo, toRoute } from "../Route"
import { sellerIDDecoder } from "../../../Core/App/Seller/SellerID"

export function onEnterRoute(): Action {
  return (state) => {
    const sellerIDs = Array.from(
      new Set(state.cart.items.map((item) => item.product.sellerID.unwrap())),
    )

    return [
      _PaymentState(state, {
        mineVouchersResponse: RD.loading(),
        submitResponse: RD.notAsked(),
        flashMessage: null,
      }),
      cmd(
        VoucherListMineApi.call().then(onMineVouchersResponse),
        loadSellerProfiles(sellerIDs),
      ),
    ]
  }
}

export function onChangeAddress(value: string): Action {
  return (state) => [_PaymentState(state, { address: value }), cmd()]
}

export function selectVoucher(
  sellerID: string,
  voucherID: string | null,
): Action {
  return (state) => [
    _PaymentState(state, {
      selectedVoucherBySellerID: {
        ...state.payment.selectedVoucherBySellerID,
        [sellerID]: voucherID,
      },
    }),
    cmd(),
  ]
}

export function clearFlashMessage(): Action {
  return (state) => [_PaymentState(state, { flashMessage: null }), cmd()]
}

export function showFlashMessage(message: string): Action {
  return (state) => [_PaymentState(state, { flashMessage: message }), cmd()]
}

export function submitPayment(): Action {
  return (state) => {
    if (state._t !== "AuthUser") {
      return [
        state,
        cmd(perform(navigateTo(toRoute("Login", { redirect: "/payment" })))),
      ]
    }

    const address = state.payment.address.trim()
    if (address === "") {
      return [
        _PaymentState(state, { flashMessage: "Address is required." }),
        cmd(),
      ]
    }

    const grouped = new Map<
      string,
      {
        sellerID: (typeof state.cart.items)[number]["product"]["sellerID"]
        price: number
      }
    >()

    for (const item of state.cart.items) {
      const key = item.product.sellerID.unwrap()
      const current = grouped.get(key)
      const linePrice = item.product.price.unwrap() * item.quantity
      if (current == null) {
        grouped.set(key, {
          sellerID: item.product.sellerID,
          price: linePrice,
        })
      } else {
        grouped.set(key, {
          sellerID: current.sellerID,
          price: current.price + linePrice,
        })
      }
    }

    const panels = Array.from(grouped.entries()).map(([sellerIDKey, row]) => ({
      sellerID: row.sellerID.unwrap(),
      price: row.price,
      voucherID: state.payment.selectedVoucherBySellerID[sellerIDKey] ?? null,
    }))

    const decoded = OrderPaymentCreateApi.paramsDecoder.decode({
      address,
      panels,
    })

    if (decoded.ok === false) {
      return [
        _PaymentState(state, {
          flashMessage:
            "Invalid payment data. Please check your address and vouchers.",
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        submitResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(OrderPaymentCreateApi.call(decoded.value).then(onCreateResponse)),
    ]
  }
}

function onMineVouchersResponse(response: VoucherListMineApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          mineVouchersResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        mineVouchers: response.value.vouchers,
        mineVouchersResponse: RD.success(response.value),
      }),
      cmd(),
    ]
  }
}

function onCreateResponse(response: OrderPaymentCreateApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          submitResponse: RD.failure(response.error),
          flashMessage: OrderPaymentCreateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    localStorage.setItem("titan_cart", JSON.stringify([]))

    return [
      _CartState(
        _PaymentState(state, {
          submitResponse: RD.success(response.value),
          selectedVoucherBySellerID: {},
          flashMessage: "Payment created successfully.",
        }),
        { items: [], isOpen: false },
      ),
      cmd(),
    ]
  }
}

function loadSellerProfiles(sellerIDs: string[]): Promise<Action | null> {
  return Promise.all(
    sellerIDs.map((sellerID) =>
      SellerGetProfileApi.call({ id: sellerIDDecoder.verify(sellerID) }).then(
        (response) => ({
          sellerID,
          response,
        }),
      ),
    ),
  ).then(onSellerProfilesResponse)
}

function onSellerProfilesResponse(
  responses: Array<{
    sellerID: string
    response: SellerGetProfileApi.Response
  }>,
): Action {
  return (state) => {
    const sellerShopNameByID = { ...state.payment.sellerShopNameByID }

    responses.forEach(({ sellerID, response }) => {
      if (response._t === "Ok") {
        sellerShopNameByID[sellerID] = response.value.seller.shopName.unwrap()
      }
    })

    return [_PaymentState(state, { sellerShopNameByID }), cmd()]
  }
}
