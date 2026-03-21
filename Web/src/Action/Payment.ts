import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _PaymentState } from "../State/Payment"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as ZaloPayCreateApi from "../Api/Auth/User/ZaloPay/Create"
import * as ZaloPayQueryApi from "../Api/Auth/User/ZaloPay/Query"
import * as SellerGetProfileApi from "../Api/Public/Seller/GetProfile"
import { _CartState } from "../State/Cart"
import { navigateTo, toRoute } from "../Route"
import { sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import { sleep } from "../../../Core/Data/Time/Timer"

export function onEnterRoute(): Action {
  return (state) => {
    const sellerIDs = Array.from(
      new Set(state.cart.items.map((item) => item.product.sellerID.unwrap())),
    )

    return [
      _PaymentState(state, {
        mineVouchersResponse: RD.loading(),
        submitResponse: RD.notAsked(),
        zaloStatusResponse: RD.notAsked(),
        isFinalizing: false,
        flashMessage: null,
      }),
      cmd(
        VoucherListMineApi.call().then(onMineVouchersResponse),
        loadSellerProfiles(sellerIDs),
      ),
    ]
  }
}

export function onEnterResultRoute(appTransID: string | null): Action {
  return (state) => {
    if (
      appTransID != null &&
      state.payment.zaloCheckout?.appTransID !== appTransID
    ) {
      return [
        _PaymentState(state, {
          flashMessage: "Checkout session expired. Please try payment again.",
          zaloStatusResponse: RD.notAsked(),
        }),
        cmd(perform(navigateTo(toRoute("Payment", {})))),
      ]
    }

    return [
      _PaymentState(state, {
        zaloStatusResponse: RD.loading(),
      }),
      cmd(sleep(500).then(() => pollZaloStatus())),
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
        items: Array<{
          productID: string
          variantID: string
          quantity: number
        }>
      }
    >()

    for (const item of state.cart.items) {
      const key = item.product.sellerID.unwrap()
      const current = grouped.get(key)
      const firstVariant = item.product.variants[0]
      if (firstVariant == null) {
        return [
          _PaymentState(state, {
            flashMessage: `Invalid cart item: ${item.product.name.unwrap()} has no variant.`,
          }),
          cmd(),
        ]
      }

      const linePrice = item.product.price.unwrap() * item.quantity
      if (current == null) {
        grouped.set(key, {
          sellerID: item.product.sellerID,
          price: linePrice,
          items: [
            {
              productID: item.product.id.unwrap(),
              variantID: firstVariant.id.unwrap(),
              quantity: item.quantity,
            },
          ],
        })
      } else {
        grouped.set(key, {
          sellerID: current.sellerID,
          price: current.price + linePrice,
          items: [
            ...current.items,
            {
              productID: item.product.id.unwrap(),
              variantID: firstVariant.id.unwrap(),
              quantity: item.quantity,
            },
          ],
        })
      }
    }

    const panels = Array.from(grouped.entries()).map(([sellerIDKey, row]) => ({
      sellerID: row.sellerID.unwrap(),
      price: row.price,
      voucherID: state.payment.selectedVoucherBySellerID[sellerIDKey] ?? null,
      items: row.items,
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
        zaloStatusResponse: RD.notAsked(),
        flashMessage: null,
      }),
      cmd(
        ZaloPayCreateApi.call({ panels: decoded.value.panels }).then(
          (response) => onZaloCreateResponse(response, decoded.value),
        ),
      ),
    ]
  }
}

export function pollZaloStatus(): Action {
  return (state) => {
    const appTransID = state.payment.zaloCheckout?.appTransID
    if (appTransID == null) {
      return [state, cmd()]
    }

    return [
      _PaymentState(state, {
        zaloStatusResponse: RD.loading(),
      }),
      cmd(ZaloPayQueryApi.call({ appTransID }).then(onZaloQueryResponse)),
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
          isFinalizing: false,
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
          pendingFinalizeParams: null,
          isFinalizing: false,
          finalizedAppTransIDs:
            state.payment.zaloCheckout == null
              ? state.payment.finalizedAppTransIDs
              : state.payment.finalizedAppTransIDs.includes(
                    state.payment.zaloCheckout.appTransID,
                  )
                ? state.payment.finalizedAppTransIDs
                : [
                    ...state.payment.finalizedAppTransIDs,
                    state.payment.zaloCheckout.appTransID,
                  ],
          zaloCheckout: null,
          flashMessage: "Payment created successfully.",
        }),
        { items: [], isOpen: false },
      ),
      cmd(),
    ]
  }
}

function onZaloCreateResponse(
  response: ZaloPayCreateApi.Response,
  finalizeParams: OrderPaymentCreateApi.BodyParams,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          submitResponse: RD.notAsked(),
          flashMessage: ZaloPayCreateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        submitResponse: RD.notAsked(),
        zaloCheckout: response.value,
        pendingFinalizeParams: finalizeParams,
        isFinalizing: false,
        flashMessage: null,
      }),
      cmd(
        perform(
          navigateTo(
            toRoute("PaymentResult", {
              appTransID: response.value.appTransID,
            }),
          ),
        ),
      ),
    ]
  }
}

function onZaloQueryResponse(response: ZaloPayQueryApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.failure(response.error),
          flashMessage: ZaloPayQueryApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    if (response.value.status === "PENDING") {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
        }),
        cmd(sleep(4000).then(() => pollZaloStatus())),
      ]
    }

    if (response.value.status === "FAILED") {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
          flashMessage: "Payment failed or was cancelled.",
        }),
        cmd(),
      ]
    }

    const finalizeParams = state.payment.pendingFinalizeParams
    const appTransID = state.payment.zaloCheckout?.appTransID

    if (
      appTransID != null &&
      state.payment.finalizedAppTransIDs.includes(appTransID)
    ) {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
          flashMessage: "Payment already finalized.",
        }),
        cmd(),
      ]
    }

    if (state.payment.isFinalizing) {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
          flashMessage: "Finalizing payment, please wait...",
        }),
        cmd(),
      ]
    }

    if (finalizeParams == null) {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
          flashMessage: "Payment succeeded but order payload is missing.",
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        zaloStatusResponse: RD.success(response.value),
        submitResponse: RD.loading(),
        isFinalizing: true,
      }),
      cmd(OrderPaymentCreateApi.call(finalizeParams).then(onCreateResponse)),
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
