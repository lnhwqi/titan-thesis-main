import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _PaymentState } from "../State/Payment"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as WalletDepositCreateApi from "../Api/Auth/User/Wallet/DepositCreate"
import * as WalletDepositQueryApi from "../Api/Auth/User/Wallet/DepositQuery"
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
        depositCreateResponse: RD.notAsked(),
        depositStatusResponse: RD.notAsked(),
        depositCheckout: null,
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

function openCheckoutInNewTab(orderURL: string): Action {
  return (state) => {
    window.open(orderURL, "_blank", "noopener,noreferrer")
    return [state, cmd()]
  }
}

export function onChangeAddress(value: string): Action {
  return (state) => [_PaymentState(state, { address: value }), cmd()]
}

export function onChangeDepositAmount(value: string): Action {
  return (state) => [_PaymentState(state, { depositAmount: value }), cmd()]
}

export function submitDeposit(): Action {
  return (state) => {
    if (state._t !== "AuthUser") {
      return [state, cmd()]
    }

    const amount = Math.floor(Number(state.payment.depositAmount.trim()))
    const decoded = WalletDepositCreateApi.paramsDecoder.decode({ amount })
    if (
      decoded.ok === false ||
      Number.isFinite(amount) === false ||
      amount <= 0
    ) {
      return [
        _PaymentState(state, {
          flashMessage: "Deposit amount must be greater than zero.",
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        depositCreateResponse: RD.loading(),
        depositStatusResponse: RD.notAsked(),
        flashMessage: null,
      }),
      cmd(
        WalletDepositCreateApi.call(decoded.value).then(
          onDepositCreateResponse,
        ),
      ),
    ]
  }
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
      isPaid: true,
      paymentMethod: "WALLET",
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
        pendingOrderPaymentIDs: [],
        flashMessage: null,
      }),
      cmd(
        OrderPaymentCreateApi.call(decoded.value).then(
          onCreateWalletPaidResponse,
        ),
      ),
    ]
  }
}

function onDepositCreateResponse(
  response: WalletDepositCreateApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          depositCreateResponse: RD.failure(response.error),
          flashMessage: WalletDepositCreateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        depositCreateResponse: RD.success(response.value),
        depositCheckout: response.value,
        depositStatusResponse: RD.loading(),
      }),
      cmd(
        perform(openCheckoutInNewTab(response.value.orderURL)),
        Promise.resolve().then(() => pollDepositStatus()),
      ),
    ]
  }
}

export function pollDepositStatus(): Action {
  return (state) => {
    const appTransID = state.payment.depositCheckout?.appTransID
    if (appTransID == null) {
      return [state, cmd()]
    }

    return [
      _PaymentState(state, {
        depositStatusResponse: RD.loading(),
      }),
      cmd(
        WalletDepositQueryApi.call({ appTransID }).then(onDepositQueryResponse),
      ),
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

function onCreateWalletPaidResponse(
  response: OrderPaymentCreateApi.Response,
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

    localStorage.setItem("titan_cart", JSON.stringify([]))

    return [
      _CartState(
        _PaymentState(state, {
          submitResponse: RD.success(response.value),
          selectedVoucherBySellerID: {},
          pendingFinalizeParams: null,
          pendingOrderPaymentIDs: [],
          openedCheckoutAppTransID: null,
          isFinalizing: false,
          flashMessage: "Payment completed from wallet.",
        }),
        { items: [], isOpen: false },
      ),
      cmd(),
    ]
  }
}
function onDepositQueryResponse(
  response: WalletDepositQueryApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _PaymentState(state, {
          depositStatusResponse: RD.failure(response.error),
          flashMessage: WalletDepositQueryApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    if (response.value.status === "PENDING") {
      return [
        _PaymentState(state, {
          depositStatusResponse: RD.success(response.value),
        }),
        cmd(
          Promise.resolve()
            .then(() => new Promise((resolve) => setTimeout(resolve, 4000)))
            .then(() => pollDepositStatus()),
        ),
      ]
    }

    if (state._t !== "AuthUser") {
      return [state, cmd()]
    }

    if (response.value.status === "FAILED") {
      return [
        {
          ..._PaymentState(state, {
            depositStatusResponse: RD.success(response.value),
            flashMessage: "Deposit failed or cancelled.",
          }),
          profile: response.value.user,
        },
        cmd(),
      ]
    }

    return [
      {
        ..._PaymentState(state, {
          depositStatusResponse: RD.success(response.value),
          depositAmount: "",
          depositCheckout: null,
          flashMessage: "Deposit successful. Wallet updated.",
        }),
        profile: response.value.user,
      },
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
