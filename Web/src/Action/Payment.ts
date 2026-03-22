import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _PaymentState } from "../State/Payment"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as OrderPaymentMarkPaidApi from "../Api/Auth/User/OrderPayment/MarkPaid"
import * as ZaloPayCreateApi from "../Api/Auth/User/ZaloPay/Create"
import * as ZaloPayQueryApi from "../Api/Auth/User/ZaloPay/Query"
import * as SellerGetProfileApi from "../Api/Public/Seller/GetProfile"
import { _CartState } from "../State/Cart"
import { navigateTo, toRoute } from "../Route"
import { sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import {
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import { sleep } from "../../../Core/Data/Time/Timer"

const PAYMENT_SESSION_STORAGE_KEY = "titan_payment_checkout"

type PersistedPaymentSession = {
  appTransID: string
  orderURL: string
  qrCode: string
  zpTransToken: string
  pendingFinalizeParams: OrderPaymentCreateApi.BodyParams
  pendingOrderPaymentIDs: string[]
}

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
        pendingFinalizeParams: null,
        pendingOrderPaymentIDs: [],
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
    const restoredSession =
      appTransID == null ? null : readPersistedSession(appTransID)
    const effectiveCheckout =
      state.payment.zaloCheckout ??
      (restoredSession == null
        ? null
        : {
            appTransID: restoredSession.appTransID,
            orderURL: restoredSession.orderURL,
            qrCode: restoredSession.qrCode,
            zpTransToken: restoredSession.zpTransToken,
          })
    const effectivePendingFinalizeParams =
      state.payment.pendingFinalizeParams ??
      restoredSession?.pendingFinalizeParams ??
      null
    const effectivePendingOrderPaymentIDs =
      state.payment.pendingOrderPaymentIDs.length > 0
        ? state.payment.pendingOrderPaymentIDs
        : (restoredSession?.pendingOrderPaymentIDs ?? [])

    if (appTransID != null && effectiveCheckout?.appTransID !== appTransID) {
      return [
        _PaymentState(state, {
          flashMessage: "Checkout session expired. Please try payment again.",
          zaloStatusResponse: RD.notAsked(),
        }),
        cmd(perform(navigateTo(toRoute("Payment", {})))),
      ]
    }

    const currentCheckout = effectiveCheckout
    const shouldOpenCheckoutTab =
      currentCheckout != null &&
      state.payment.openedCheckoutAppTransID !== currentCheckout.appTransID

    return [
      _PaymentState(state, {
        zaloCheckout: currentCheckout,
        pendingFinalizeParams: effectivePendingFinalizeParams,
        pendingOrderPaymentIDs: effectivePendingOrderPaymentIDs,
        zaloStatusResponse: RD.loading(),
        openedCheckoutAppTransID: shouldOpenCheckoutTab
          ? (currentCheckout?.appTransID ?? null)
          : state.payment.openedCheckoutAppTransID,
      }),
      cmd(
        shouldOpenCheckoutTab
          ? perform(openCheckoutInNewTab(currentCheckout.orderURL))
          : Promise.resolve(null),
        sleep(500).then(() => pollZaloStatus()),
      ),
    ]
  }
}

function openCheckoutInNewTab(orderURL: string): Action {
  return (state) => {
    window.open(orderURL, "_blank", "noopener,noreferrer")
    return [state, cmd()]
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
      isPaid: false,
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
        pendingOrderPaymentIDs: [],
        flashMessage: null,
      }),
      cmd(
        OrderPaymentCreateApi.call(decoded.value).then((response) =>
          onCreatePendingResponse(response, decoded.value),
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

function onCreatePendingResponse(
  response: OrderPaymentCreateApi.Response,
  finalizeParams: OrderPaymentCreateApi.BodyParams,
): Action {
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

    const pendingOrderPaymentIDs = response.value.orderPayments.map(
      (orderPayment) => orderPayment.id.unwrap(),
    )

    return [
      _PaymentState(state, {
        submitResponse: RD.success(response.value),
        pendingOrderPaymentIDs,
        pendingFinalizeParams: finalizeParams,
        flashMessage: null,
      }),
      cmd(
        ZaloPayCreateApi.call({ panels: finalizeParams.panels }).then(
          (zaloResponse) => onZaloCreateResponse(zaloResponse, finalizeParams),
        ),
      ),
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
        openedCheckoutAppTransID: null,
        isFinalizing: false,
        flashMessage: null,
      }),
      cmd(
        perform(
          persistPaymentSession({
            appTransID: response.value.appTransID,
            orderURL: response.value.orderURL,
            qrCode: response.value.qrCode,
            zpTransToken: response.value.zpTransToken,
            pendingFinalizeParams: finalizeParams,
            pendingOrderPaymentIDs: state.payment.pendingOrderPaymentIDs,
          }),
        ),
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

    if (
      finalizeParams == null ||
      state.payment.pendingOrderPaymentIDs.length === 0
    ) {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
          flashMessage: "Payment succeeded but pending bill data is missing.",
        }),
        cmd(),
      ]
    }

    if (state.payment.pendingOrderPaymentIDs.length === 0) {
      return [
        _PaymentState(state, {
          zaloStatusResponse: RD.success(response.value),
          pendingOrderPaymentIDs: [],
          pendingFinalizeParams: null,
          isFinalizing: false,
          flashMessage:
            "Payment succeeded but bill ids are invalid. Please retry checkout.",
        }),
        cmd(perform(clearPersistedSession())),
      ]
    }

    return [
      _PaymentState(state, {
        zaloStatusResponse: RD.success(response.value),
        submitResponse: RD.loading(),
        isFinalizing: true,
      }),
      cmd(
        OrderPaymentMarkPaidApi.call({
          orderPaymentIDs: state.payment.pendingOrderPaymentIDs,
          panels: finalizeParams.panels,
        }).then(
          (markPaidResponse) =>
            onMarkPaidResponse(markPaidResponse, appTransID ?? null),
        ),
      ),
    ]
  }
}

function onMarkPaidResponse(
  response: OrderPaymentMarkPaidApi.Response,
  appTransID: string | null,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          isFinalizing: false,
          flashMessage: OrderPaymentMarkPaidApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    if (response.value.updatedCount <= 0) {
      return [
        _PaymentState(state, {
          isFinalizing: false,
          flashMessage:
            "Payment succeeded but bill finalization failed. Please retry.",
        }),
        cmd(),
      ]
    }

    localStorage.setItem("titan_cart", JSON.stringify([]))

    return [
      _CartState(
        _PaymentState(state, {
          selectedVoucherBySellerID: {},
          pendingFinalizeParams: null,
          pendingOrderPaymentIDs: [],
          openedCheckoutAppTransID: null,
          isFinalizing: false,
          finalizedAppTransIDs:
            appTransID == null ||
            state.payment.finalizedAppTransIDs.includes(appTransID)
              ? state.payment.finalizedAppTransIDs
              : [...state.payment.finalizedAppTransIDs, appTransID],
          zaloCheckout: null,
          flashMessage: "Payment created successfully.",
        }),
        { items: [], isOpen: false },
      ),
      cmd(perform(clearPersistedSession())),
    ]
  }
}

function persistPaymentSession(session: PersistedPaymentSession): Action {
  return (state) => {
    localStorage.setItem(PAYMENT_SESSION_STORAGE_KEY, JSON.stringify(session))
    return [state, cmd()]
  }
}

function clearPersistedSession(): Action {
  return (state) => {
    localStorage.removeItem(PAYMENT_SESSION_STORAGE_KEY)
    return [state, cmd()]
  }
}

function readPersistedSession(
  expectedAppTransID: string,
): PersistedPaymentSession | null {
  const raw = localStorage.getItem(PAYMENT_SESSION_STORAGE_KEY)
  if (raw == null) {
    return null
  }

  const parsed: unknown = (() => {
    try {
      return JSON.parse(raw)
    } catch (_error) {
      return null
    }
  })()
  if (typeof parsed !== "object" || parsed == null) {
    return null
  }

  const appTransID = Reflect.get(parsed, "appTransID")
  const orderURL = Reflect.get(parsed, "orderURL")
  const qrCode = Reflect.get(parsed, "qrCode")
  const zpTransToken = Reflect.get(parsed, "zpTransToken")
  const pendingFinalizeParams = Reflect.get(parsed, "pendingFinalizeParams")
  const pendingOrderPaymentIDs = Reflect.get(parsed, "pendingOrderPaymentIDs")

  if (
    typeof appTransID !== "string" ||
    typeof orderURL !== "string" ||
    typeof qrCode !== "string" ||
    typeof zpTransToken !== "string" ||
    appTransID !== expectedAppTransID
  ) {
    return null
  }

  const decodedFinalize = OrderPaymentCreateApi.paramsDecoder.decode(
    pendingFinalizeParams,
  )
  if (decodedFinalize.ok === false) {
    return null
  }

  const decodedPendingOrderPaymentIDs = decodeOrderPaymentIDs(
    pendingOrderPaymentIDs,
  )
  if (decodedPendingOrderPaymentIDs == null) {
    return null
  }

  return {
    appTransID,
    orderURL,
    qrCode,
    zpTransToken,
    pendingFinalizeParams: decodedFinalize.value,
    pendingOrderPaymentIDs: decodedPendingOrderPaymentIDs,
  }
}

function decodeOrderPaymentIDs(value: unknown): string[] | null {
  if (Array.isArray(value) === false) {
    return null
  }

  const decodedIDs: string[] = []

  for (const id of value) {
    const decodedID = orderPaymentIDDecoder.decode(id)
    if (decodedID.ok === false) {
      return null
    }

    decodedIDs.push(decodedID.value.unwrap())
  }

  return decodedIDs
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
