import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd, perform } from "../Action"
import { _PaymentState, PaymentMethod } from "../State/Payment"
import * as VoucherListMineApi from "../Api/Auth/User/Voucher/ListMine"
import * as OrderPaymentCreateApi from "../Api/Auth/User/OrderPayment/Create"
import * as WalletDepositCreateApi from "../Api/Auth/User/Wallet/DepositCreate"
import * as WalletDepositQueryApi from "../Api/Auth/User/Wallet/DepositQuery"
import * as SellerGetProfileApi from "../Api/Public/Seller/GetProfile"
import * as GetProvinceApi from "../Api/Public/Address/GetProvince"
import * as GetDistrictApi from "../Api/Public/Address/GetDistrict"
import * as GetWardApi from "../Api/Public/Address/GetWard"
import * as ProductGetOneApi from "../Api/Public/Product/GetOne"
import { _CartState } from "../State/Cart"
import { navigateTo, toRoute } from "../Route"
import { sellerIDDecoder } from "../../../Core/App/Seller/SellerID"
import { productIDDecoder } from "../../../Core/App/Product/ProductID"
import { createPrice } from "../../../Core/App/Product/Price"
import * as MessageAction from "./Message"
import * as BalanceAction from "./Balance"

export function onEnterRoute(): Action {
  return (state) => {
    const sellerIDs = Array.from(
      new Set(state.cart.items.map((item) => item.product.sellerID.unwrap())),
    )

    const uniqueProductIDs = Array.from(
      new Set(state.cart.items.map((item) => item.product.id.unwrap())),
    )

    const refreshCmds = uniqueProductIDs.map((rawID) => {
      const productID = productIDDecoder.verify(rawID)
      return ProductGetOneApi.call({ id: productID }).then((response) =>
        onRefreshProductPrice(rawID, response),
      )
    })

    return [
      _PaymentState(state, {
        mineVouchersResponse: RD.loading(),
        submitResponse: RD.notAsked(),
        priceChangedVisible: false,
        depositCreateResponse: RD.notAsked(),
        depositStatusResponse: RD.notAsked(),
        depositCheckout: null,
        pendingFinalizeParams: null,
        pendingOrderPaymentIDs: [],
        isFinalizing: false,
        flashMessage: null,
        provinces: [],
        districts: [],
        wards: [],
        selectedProvinceID: null,
        selectedDistrictID: null,
        selectedWardCode: null,
        addressDetail: "",
        paymentOtpCode: "",
        selectedPaymentMethod: null,
        otpPopupVisible: false,
        otpPopupMessage: null,
        otpResendCooldown: 0,
      }),
      cmd(
        VoucherListMineApi.call().then(onMineVouchersResponse),
        loadSellerProfiles(sellerIDs),
        GetProvinceApi.call().then(onProvincesResponse),
        ...refreshCmds,
      ),
    ]
  }
}

function onRefreshProductPrice(
  rawProductID: string,
  response: ProductGetOneApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [state, cmd()]
    }

    const fresh = response.value
    const updatedItems = state.cart.items.map((item) => {
      if (item.product.id.unwrap() !== rawProductID) {
        return item
      }

      const updatedVariants = item.product.variants.map((variant) => {
        const freshVariant = fresh.variants.find(
          (v) => v.id.unwrap() === variant.id.unwrap(),
        )
        return freshVariant != null
          ? { ...variant, price: freshVariant.price, stock: freshVariant.stock }
          : variant
      })

      return {
        ...item,
        product: {
          ...item.product,
          price:
            (updatedVariants[0] != null
              ? createPrice(updatedVariants[0].price.unwrap())
              : null) ?? fresh.price,
          variants: updatedVariants,
        },
      }
    })

    return [_CartState(state, { items: updatedItems }), cmd()]
  }
}

function openCheckoutInNewTab(orderURL: string): Action {
  return (state) => {
    window.open(orderURL, "_blank", "noopener,noreferrer")
    return [state, cmd()]
  }
}

export function onChangeAddress(value: string): Action {
  return (state) => [_PaymentState(state, { addressDetail: value }), cmd()]
}

export function onChangePaymentOtp(value: string): Action {
  const sanitized = value.replace(/[^0-9]/g, "").slice(0, 6)
  return (state) => [
    _PaymentState(state, { paymentOtpCode: sanitized, otpPopupMessage: null }),
    cmd(),
  ]
}

export function selectPaymentMethod(method: PaymentMethod): Action {
  return (state) => [
    _PaymentState(state, { selectedPaymentMethod: method }),
    cmd(),
  ]
}

const OTP_RESEND_COOLDOWN_SECONDS = 60

export function openOtpPopup(): Action {
  return (state) => {
    if (!("updateProfile" in state)) {
      return [
        state,
        cmd(perform(navigateTo(toRoute("Login", { redirect: "/payment" })))),
      ]
    }

    if (!state.profile.active.unwrap()) {
      return [
        _PaymentState(state, {
          flashMessage:
            "Your account is suspended. Please contact admin via chatbox.",
        }),
        cmd(perform(MessageAction.toggleChatbox())),
      ]
    }

    if (state.payment.selectedPaymentMethod == null) {
      return [
        _PaymentState(state, {
          flashMessage: "Please select a payment method.",
        }),
        cmd(),
      ]
    }

    const { selectedProvinceID, selectedDistrictID, selectedWardCode } =
      state.payment
    const detail = state.payment.addressDetail.trim()

    if (selectedProvinceID == null) {
      return [
        _PaymentState(state, { flashMessage: "Please select a province." }),
        cmd(),
      ]
    }
    if (selectedDistrictID == null) {
      return [
        _PaymentState(state, { flashMessage: "Please select a district." }),
        cmd(),
      ]
    }
    if (selectedWardCode == null) {
      return [
        _PaymentState(state, { flashMessage: "Please select a ward." }),
        cmd(),
      ]
    }
    if (detail === "") {
      return [
        _PaymentState(state, {
          flashMessage: "Please enter house number and street name.",
        }),
        cmd(),
      ]
    }

    if (state.cart.items.length === 0) {
      return [
        _PaymentState(state, { flashMessage: "Your cart is empty." }),
        cmd(),
      ]
    }

    // COD: submit order directly — no OTP, user pays cash on delivery
    if (state.payment.selectedPaymentMethod === "CASH") {
      return [
        _PaymentState(state, {
          submitResponse: RD.loading(),
          flashMessage: null,
        }),
        cmd(Promise.resolve().then(() => submitCodOrder())),
      ]
    }

    // ZaloPay (wallet): send OTP first, confirm before charging wallet
    return [
      _PaymentState(state, {
        submitResponse: RD.loading(),
        paymentOtpCode: "",
        otpPopupVisible: false,
        otpPopupMessage: null,
        otpResendCooldown: 0,
        flashMessage: null,
      }),
      cmd(Promise.resolve().then(() => requestOtpForPayment())),
    ]
  }
}

// ─── COD flow ────────────────────────────────────────────────────────────────

function submitCodOrder(): Action {
  return (state) => {
    if (!("updateProfile" in state)) return [state, cmd()]

    const buildParams = buildPaymentParams(state)
    if (buildParams._t === "Err") {
      return [
        _PaymentState(state, {
          submitResponse: RD.notAsked(),
          flashMessage: buildParams.message,
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, { submitResponse: RD.loading() }),
      cmd(
        OrderPaymentCreateApi.call(buildParams.value).then(onCodOrderResponse),
      ),
    ]
  }
}

function onCodOrderResponse(response: OrderPaymentCreateApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      if (response.error === "PRICE_CHANGED") {
        const uniqueProductIDs = Array.from(
          new Set(state.cart.items.map((item) => item.product.id.unwrap())),
        )
        const refreshCmds = uniqueProductIDs.map((rawID) => {
          const productID = productIDDecoder.verify(rawID)
          return ProductGetOneApi.call({ id: productID }).then((res) =>
            onRefreshProductPrice(rawID, res),
          )
        })
        return [
          _PaymentState(state, {
            submitResponse: RD.failure(response.error),
            priceChangedVisible: true,
          }),
          cmd(...refreshCmds),
        ]
      }

      return [
        _PaymentState(state, {
          submitResponse: RD.failure(response.error),
          flashMessage: OrderPaymentCreateApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    localStorage.setItem("titan_cart", JSON.stringify([]))
    const firstSellerID = response.value.orderPayments[0]?.sellerID

    return [
      _CartState(
        _PaymentState(state, {
          submitResponse: RD.success(response.value),
          selectedVoucherBySellerID: {},
          flashMessage: "COD order placed. Please pay cash upon delivery.",
        }),
        { items: [], isOpen: false },
      ),
      cmd(
        firstSellerID != null
          ? Promise.resolve(
              MessageAction.openConversationWithSeller(firstSellerID),
            )
          : Promise.resolve(null),
      ),
    ]
  }
}

// ─── ZaloPay / wallet OTP flow ────────────────────────────────────────────────

function requestOtpForPayment(): Action {
  return (state) => {
    if (!("updateProfile" in state)) return [state, cmd()]

    const buildParams = buildPaymentParams(state)
    if (buildParams._t === "Err") {
      return [
        _PaymentState(state, {
          submitResponse: RD.notAsked(),
          flashMessage: buildParams.message,
        }),
        cmd(),
      ]
    }

    const params = { ...buildParams.value, otpCode: undefined }
    return [
      _PaymentState(state, { submitResponse: RD.loading() }),
      cmd(OrderPaymentCreateApi.call(params).then(onRequestOtpResponse)),
    ]
  }
}

function onRequestOtpResponse(
  response: OrderPaymentCreateApi.Response,
): Action {
  return (state) => {
    if (response._t === "Ok") {
      return onCreateWalletPaidResponse(response)(state)
    }

    if (
      response.error === "OTP_REQUIRED" ||
      response.error === "OTP_RATE_LIMITED"
    ) {
      const message =
        response.error === "OTP_RATE_LIMITED"
          ? "OTP rate limited. Please wait before requesting again."
          : "An OTP has been sent to your email. Enter it below to confirm payment."
      return [
        _PaymentState(state, {
          submitResponse: RD.notAsked(),
          otpPopupVisible: true,
          otpPopupMessage: message,
          paymentOtpCode: "",
          otpResendCooldown: OTP_RESEND_COOLDOWN_SECONDS,
        }),
        cmd(Promise.resolve().then(() => tickOtpCooldown())),
      ]
    }

    return [
      _PaymentState(state, {
        submitResponse: RD.failure(response.error),
        flashMessage: OrderPaymentCreateApi.errorString(response.error),
      }),
      cmd(),
    ]
  }
}

export function tickOtpCooldown(): Action {
  return (state) => {
    if (
      state.payment.otpResendCooldown <= 0 ||
      !state.payment.otpPopupVisible
    ) {
      return [state, cmd()]
    }

    const next = state.payment.otpResendCooldown - 1
    return [
      _PaymentState(state, { otpResendCooldown: next }),
      cmd(
        next > 0
          ? new Promise<Action>((resolve) =>
              setTimeout(() => resolve(tickOtpCooldown()), 1000),
            )
          : Promise.resolve(null),
      ),
    ]
  }
}

export function closeOtpPopup(): Action {
  return (state) => [
    _PaymentState(state, {
      otpPopupVisible: false,
      otpPopupMessage: null,
      paymentOtpCode: "",
      otpResendCooldown: 0,
      submitResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function resendOtp(): Action {
  return (state) => {
    if (state.payment.otpResendCooldown > 0) {
      return [state, cmd()]
    }

    return [
      _PaymentState(state, {
        submitResponse: RD.loading(),
        paymentOtpCode: "",
        otpPopupMessage: null,
        otpResendCooldown: 0,
      }),
      cmd(Promise.resolve().then(() => requestOtpForPayment())),
    ]
  }
}

export function submitOtpAndPay(): Action {
  return (state) => {
    if (!("updateProfile" in state)) return [state, cmd()]

    const trimmedOtp = state.payment.paymentOtpCode.trim()
    if (trimmedOtp.length !== 6) {
      return [
        _PaymentState(state, {
          otpPopupMessage: "Please enter the full 6-digit OTP code.",
        }),
        cmd(),
      ]
    }

    const buildParams = buildPaymentParams(state)
    if (buildParams._t === "Err") {
      return [
        _PaymentState(state, {
          otpPopupVisible: false,
          flashMessage: buildParams.message,
        }),
        cmd(),
      ]
    }

    const params = { ...buildParams.value, otpCode: trimmedOtp }
    return [
      _PaymentState(state, {
        submitResponse: RD.loading(),
        otpPopupMessage: null,
      }),
      cmd(OrderPaymentCreateApi.call(params).then(onSubmitOtpPayResponse)),
    ]
  }
}

function onSubmitOtpPayResponse(
  response: OrderPaymentCreateApi.Response,
): Action {
  return (state) => {
    if (response._t === "Ok") {
      return [
        _PaymentState(state, { otpPopupVisible: false, otpResendCooldown: 0 }),
        cmd(perform(onCreateWalletPaidResponse(response))),
      ]
    }

    if (response.error === "OTP_INVALID" || response.error === "OTP_EXPIRED") {
      return [
        _PaymentState(state, {
          submitResponse: RD.notAsked(),
          otpPopupMessage:
            response.error === "OTP_EXPIRED"
              ? "OTP has expired. Please resend."
              : "Invalid OTP code. Please try again.",
          paymentOtpCode: "",
        }),
        cmd(),
      ]
    }

    return [
      _PaymentState(state, {
        submitResponse: RD.failure(response.error),
        otpPopupVisible: false,
        flashMessage: OrderPaymentCreateApi.errorString(response.error),
      }),
      cmd(),
    ]
  }
}

type BuildResult =
  | { _t: "Ok"; value: OrderPaymentCreateApi.BodyParams }
  | { _t: "Err"; message: string }

function buildPaymentParams(state: {
  payment: {
    selectedProvinceID: number | null
    selectedDistrictID: number | null
    selectedWardCode: string | null
    addressDetail: string
    selectedPaymentMethod: PaymentMethod | null
    selectedVoucherBySellerID: Record<string, string | null>
    provinces: Array<{ ProvinceID: number; ProvinceName: string }>
    districts: Array<{ DistrictID: number; DistrictName: string }>
    wards: Array<{ WardCode: string; WardName: string }>
  }
  cart: {
    items: Array<{
      product: {
        sellerID: { unwrap(): string }
        id: { unwrap(): string }
        name: { unwrap(): string }
        variants: Array<{
          id: { unwrap(): string }
          price: { unwrap(): number }
        }>
      }
      quantity: number
    }>
  }
}): BuildResult {
  const {
    selectedProvinceID,
    selectedDistrictID,
    selectedWardCode,
    addressDetail,
    selectedPaymentMethod,
    provinces,
    districts,
    wards,
  } = state.payment

  if (
    selectedProvinceID == null ||
    selectedDistrictID == null ||
    selectedWardCode == null
  ) {
    return { _t: "Err", message: "Please complete your address." }
  }

  const detail = addressDetail.trim()
  if (detail === "") {
    return { _t: "Err", message: "Please enter house number and street name." }
  }

  const province = provinces.find((p) => p.ProvinceID === selectedProvinceID)
  const district = districts.find((d) => d.DistrictID === selectedDistrictID)
  const ward = wards.find((w) => w.WardCode === selectedWardCode)

  if (province == null || district == null || ward == null) {
    return {
      _t: "Err",
      message: "Invalid address selection. Please try again.",
    }
  }

  const address = {
    provinceCode: String(province.ProvinceID),
    provinceName: province.ProvinceName,
    districtCode: String(district.DistrictID),
    districtName: district.DistrictName,
    wardCode: ward.WardCode,
    wardName: ward.WardName,
    detail,
  }

  const grouped = new Map<
    string,
    {
      sellerID: (typeof state.cart.items)[number]["product"]["sellerID"]
      price: number
      items: Array<{ productID: string; variantID: string; quantity: number }>
    }
  >()

  for (const item of state.cart.items) {
    const key = item.product.sellerID.unwrap()
    const current = grouped.get(key)
    const firstVariant = item.product.variants[0]
    if (firstVariant == null) {
      return {
        _t: "Err",
        message: `Invalid cart item: ${item.product.name.unwrap()} has no variant.`,
      }
    }

    const linePrice = firstVariant.price.unwrap() * item.quantity
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

  // WALLET frontend = pay from wallet (isPaid true); CASH frontend = COD (isPaid false)
  const isWallet = selectedPaymentMethod === "WALLET"
  const panels = Array.from(grouped.entries()).map(([sellerIDKey, row]) => ({
    sellerID: row.sellerID.unwrap(),
    price: row.price,
    voucherID: state.payment.selectedVoucherBySellerID[sellerIDKey] ?? null,
    items: row.items,
  }))

  const decoded = OrderPaymentCreateApi.paramsDecoder.decode({
    address,
    panels,
    isPaid: isWallet,
    paymentMethod: isWallet ? "WALLET" : "ZALOPAY",
  })

  if (decoded.ok === false) {
    return {
      _t: "Err",
      message: "Invalid payment data. Please check your address and cart.",
    }
  }

  return { _t: "Ok", value: decoded.value }
}

export function onSelectProvince(provinceID: number): Action {
  return (state) => [
    _PaymentState(state, {
      selectedProvinceID: provinceID,
      selectedDistrictID: null,
      selectedWardCode: null,
      districts: [],
      wards: [],
    }),
    cmd(
      GetDistrictApi.call({ province_id: String(provinceID) }).then(
        onDistrictsResponse,
      ),
    ),
  ]
}

export function onSelectDistrict(districtID: number): Action {
  return (state) => [
    _PaymentState(state, {
      selectedDistrictID: districtID,
      selectedWardCode: null,
      wards: [],
    }),
    cmd(
      GetWardApi.call({ district_id: String(districtID) }).then(
        onWardsResponse,
      ),
    ),
  ]
}

export function onSelectWard(wardCode: string): Action {
  return (state) => [
    _PaymentState(state, { selectedWardCode: wardCode }),
    cmd(),
  ]
}

function onProvincesResponse(response: GetProvinceApi.Response): Action {
  return (state) => {
    if (response._t === "Err") return [state, cmd()]
    return [_PaymentState(state, { provinces: response.value }), cmd()]
  }
}

function onDistrictsResponse(response: GetDistrictApi.Response): Action {
  return (state) => {
    if (response._t === "Err") return [state, cmd()]
    return [_PaymentState(state, { districts: response.value }), cmd()]
  }
}

function onWardsResponse(response: GetWardApi.Response): Action {
  return (state) => {
    if (response._t === "Err") return [state, cmd()]
    return [_PaymentState(state, { wards: response.value }), cmd()]
  }
}

export function onChangeDepositAmount(value: string): Action {
  return (state) => [_PaymentState(state, { depositAmount: value }), cmd()]
}

export function submitDeposit(): Action {
  return (state) => {
    if (!("updateProfile" in state)) {
      return [state, cmd()]
    }

    if (!state.profile.active.unwrap()) {
      return [
        _PaymentState(state, {
          flashMessage:
            "Your account is suspended. Please contact admin via chatbox.",
        }),
        cmd(perform(MessageAction.toggleChatbox())),
      ]
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

export function dismissPriceChanged(): Action {
  return (state) => [
    _PaymentState(state, { priceChangedVisible: false }),
    cmd(),
  ]
}

export function showFlashMessage(message: string): Action {
  return (state) => [_PaymentState(state, { flashMessage: message }), cmd()]
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
      if (response.error === "PRICE_CHANGED") {
        const uniqueProductIDs = Array.from(
          new Set(state.cart.items.map((item) => item.product.id.unwrap())),
        )
        const refreshCmds = uniqueProductIDs.map((rawID) => {
          const productID = productIDDecoder.verify(rawID)
          return ProductGetOneApi.call({ id: productID }).then((res) =>
            onRefreshProductPrice(rawID, res),
          )
        })
        return [
          _PaymentState(state, {
            submitResponse: RD.failure(response.error),
            isFinalizing: false,
            priceChangedVisible: true,
          }),
          cmd(...refreshCmds),
        ]
      }

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

    const firstSellerID = response.value.orderPayments[0]?.sellerID

    return [
      _CartState(
        _PaymentState(state, {
          submitResponse: RD.success(response.value),
          selectedVoucherBySellerID: {},
          paymentOtpCode: "",
          pendingFinalizeParams: null,
          pendingOrderPaymentIDs: [],
          openedCheckoutAppTransID: null,
          isFinalizing: false,
          flashMessage: "Payment completed from wallet.",
        }),
        { items: [], isOpen: false },
      ),
      cmd(
        perform(BalanceAction.refreshBalance()),
        firstSellerID != null
          ? Promise.resolve(
              MessageAction.openConversationWithSeller(firstSellerID),
            )
          : Promise.resolve(null),
      ),
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

    if (!("updateProfile" in state)) {
      return [state, cmd()]
    }

    const depositStatusResponse: typeof state.payment.depositStatusResponse = {
      _t: "Success",
      data: response.value,
    }

    const nextPaymentState = {
      ...state.payment,
      depositStatusResponse,
    }

    if (response.value.status === "FAILED") {
      return [
        {
          ...state,
          payment: {
            ...nextPaymentState,
            flashMessage: "Deposit failed or cancelled.",
          },
          profile: response.value.user,
        },
        cmd(),
      ]
    }

    return [
      {
        ...state,
        payment: {
          ...nextPaymentState,
          depositAmount: "",
          depositCheckout: null,
          flashMessage: "Deposit successful. Wallet updated.",
        },
        profile: response.value.user,
        userBalance: response.value.user.wallet,
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
