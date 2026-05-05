import * as JD from "decoders"
import * as Teki from "teki"
import { UrlRecord } from "../../Core/Data/UrlToken"
import { Maybe, maybeOptionalDecoder } from "../../Core/Data/Maybe"
import type { Action } from "./Action"
import type { State } from "./State"

export type Route =
  | { _t: "Home"; path: "/"; params: NoParams }
  | {
      _t: "Category"
      path: "/category/:id"
      params: {
        id: string
      }
    }
  | { _t: "Saved"; path: "/saved"; params: NoParams }
  | { _t: "NotFound"; path: "/not-found"; params: NoParams }
  | { _t: "Register"; path: "/register"; params: NoParams }
  | { _t: "AdminLogin"; path: "/admin/login"; params: NoParams }
  | { _t: "SellerLogin"; path: "/seller/login"; params: NoParams }
  | { _t: "SellerDashboard"; path: "/seller/dashboard"; params: NoParams }
  | {
      _t: "SellerProductCreate"
      path: "/seller/products/create"
      params: NoParams
    }
  | {
      _t: "SellerProductEdit"
      path: "/seller/products/:id/edit"
      params: { id: string }
    }
  | {
      _t: "SellerShipping"
      path: "/seller/shipping"
      params: NoParams
    }
  | {
      _t: "SellerVoucherCreate"
      path: "/seller/voucher/create"
      params: NoParams
    }
  | {
      _t: "AdminDashboard"
      path: "/admin/dashboard"
      params: NoParams
    }
  | {
      _t: "AdminSellerModeration"
      path: "/admin/seller-moderation"
      params: NoParams
    }
  | {
      _t: "AdminCategoryManagement"
      path: "/admin/categories"
      params: NoParams
    }
  | {
      _t: "AdminPosterManagement"
      path: "/admin/posters"
      params: NoParams
    }
  | {
      _t: "Login"
      path: "/login?redirect=:redirect"
      params: {
        redirect: Maybe<string>
      }
    }
  | {
      _t: "Profile"
      path: "/profile"
      params: NoParams
    }
  | {
      _t: "Search"
      path: "/search?name=:name"
      params: {
        name: Maybe<string>
      }
    }
  | {
      _t: "Payment"
      path: "/payment"
      params: NoParams
    }
  | {
      _t: "PaymentResult"
      path: "/payment/result?appTransID=:appTransID"
      params: {
        appTransID: Maybe<string>
      }
    }
  | {
      _t: "WalletDeposit"
      path: "/wallet/deposit"
      params: NoParams
    }
  | {
      _t: "UserOrders"
      path: "/orders"
      params: NoParams
    }
  | {
      _t: "UserReports"
      path: "/reports"
      params: NoParams
    }
  | {
      _t: "UserReportCreate"
      path: "/reports/new/:orderID/:sellerID"
      params: {
        orderID: string
        sellerID: string
      }
    }
  | {
      _t: "SellerOrders"
      path: "/seller/orders"
      params: NoParams
    }
  | {
      _t: "SellerReports"
      path: "/seller/reports"
      params: NoParams
    }
  | {
      _t: "AdminReports"
      path: "/admin/reports"
      params: NoParams
    }
  | {
      _t: "AdminSetting"
      path: "/admin/setting"
      params: NoParams
    }
  | {
      _t: "AdminOrderManagement"
      path: "/admin/orders"
      params: NoParams
    }
  | {
      _t: "AdminSupportMonitoring"
      path: "/admin/support-monitoring"
      params: NoParams
    }
  | {
      _t: "AdminCoinRain"
      path: "/admin/coin-rain"
      params: NoParams
    }
  | {
      _t: "AdminUserManagement"
      path: "/admin/users"
      params: NoParams
    }
  | {
      _t: "ProductDetail"
      path: "/product/:id"
      params: {
        id: string
      }
    }
  | {
      _t: "SellerProfile"
      path: "/seller/:id"
      params: {
        id: string
      }
    }
  | {
      _t: "EventPoster"
      path: "/event/:id"
      params: {
        id: string
      }
    }

const router: RouteTable = {
  Home: {
    path: "/",
    decoder: JD.object({
      _t: JD.always("Home"),
      path: JD.always("/"),
      params: JD.object({}),
    }),
  },
  Category: {
    path: "/category/:id",
    decoder: JD.object({
      _t: JD.always("Category"),
      path: JD.always("/category/:id"),
      params: JD.object({
        id: JD.string,
      }),
    }),
  },
  Saved: {
    path: "/saved",
    decoder: JD.object({
      _t: JD.always("Saved"),
      path: JD.always("/saved"),
      params: JD.object({}),
    }),
  },
  NotFound: {
    path: "/not-found",
    decoder: JD.object({
      _t: JD.always("NotFound"),
      path: JD.always("/not-found"),
      params: JD.object({}),
    }),
  },
  Register: {
    path: "/register",
    decoder: JD.object({
      _t: JD.always("Register"),
      path: JD.always("/register"),
      params: JD.object({}),
    }),
  },
  AdminLogin: {
    path: "/admin/login",
    decoder: JD.object({
      _t: JD.always("AdminLogin"),
      path: JD.always("/admin/login"),
      params: JD.object({}),
    }),
  },
  SellerLogin: {
    path: "/seller/login",
    decoder: JD.object({
      _t: JD.always("SellerLogin"),
      path: JD.always("/seller/login"),
      params: JD.object({}),
    }),
  },
  SellerDashboard: {
    path: "/seller/dashboard",
    decoder: JD.object({
      _t: JD.always("SellerDashboard"),
      path: JD.always("/seller/dashboard"),
      params: JD.object({}),
    }),
  },
  SellerProductCreate: {
    path: "/seller/products/create",
    decoder: JD.object({
      _t: JD.always("SellerProductCreate"),
      path: JD.always("/seller/products/create"),
      params: JD.object({}),
    }),
  },
  SellerProductEdit: {
    path: "/seller/products/:id/edit",
    decoder: JD.object({
      _t: JD.always("SellerProductEdit"),
      path: JD.always("/seller/products/:id/edit"),
      params: JD.object({
        id: JD.string,
      }),
    }),
  },
  SellerShipping: {
    path: "/seller/shipping",
    decoder: JD.object({
      _t: JD.always("SellerShipping"),
      path: JD.always("/seller/shipping"),
      params: JD.object({}),
    }),
  },
  SellerVoucherCreate: {
    path: "/seller/voucher/create",
    decoder: JD.object({
      _t: JD.always("SellerVoucherCreate"),
      path: JD.always("/seller/voucher/create"),
      params: JD.object({}),
    }),
  },
  AdminDashboard: {
    path: "/admin/dashboard",
    decoder: JD.object({
      _t: JD.always("AdminDashboard"),
      path: JD.always("/admin/dashboard"),
      params: JD.object({}),
    }),
  },
  AdminCategoryManagement: {
    path: "/admin/categories",
    decoder: JD.object({
      _t: JD.always("AdminCategoryManagement"),
      path: JD.always("/admin/categories"),
      params: JD.object({}),
    }),
  },
  AdminPosterManagement: {
    path: "/admin/posters",
    decoder: JD.object({
      _t: JD.always("AdminPosterManagement"),
      path: JD.always("/admin/posters"),
      params: JD.object({}),
    }),
  },
  AdminSetting: {
    path: "/admin/setting",
    decoder: JD.object({
      _t: JD.always("AdminSetting"),
      path: JD.always("/admin/setting"),
      params: JD.object({}),
    }),
  },
  AdminOrderManagement: {
    path: "/admin/orders",
    decoder: JD.object({
      _t: JD.always("AdminOrderManagement"),
      path: JD.always("/admin/orders"),
      params: JD.object({}),
    }),
  },
  AdminSupportMonitoring: {
    path: "/admin/support-monitoring",
    decoder: JD.object({
      _t: JD.always("AdminSupportMonitoring"),
      path: JD.always("/admin/support-monitoring"),
      params: JD.object({}),
    }),
  },
  AdminCoinRain: {
    path: "/admin/coin-rain",
    decoder: JD.object({
      _t: JD.always("AdminCoinRain"),
      path: JD.always("/admin/coin-rain"),
      params: JD.object({}),
    }),
  },
  AdminUserManagement: {
    path: "/admin/users",
    decoder: JD.object({
      _t: JD.always("AdminUserManagement"),
      path: JD.always("/admin/users"),
      params: JD.object({}),
    }),
  },
  AdminSellerModeration: {
    path: "/admin/seller-moderation",
    decoder: JD.object({
      _t: JD.always("AdminSellerModeration"),
      path: JD.always("/admin/seller-moderation"),
      params: JD.object({}),
    }),
  },
  Login: {
    path: "/login?redirect=:redirect",
    decoder: JD.object({
      _t: JD.always("Login"),
      path: JD.always("/login?redirect=:redirect"),
      params: JD.object({
        redirect: maybeOptionalDecoder(JD.string),
      }),
    }),
  },
  Profile: {
    path: "/profile",
    decoder: JD.object({
      _t: JD.always("Profile"),
      path: JD.always("/profile"),
      params: JD.object({}),
    }),
  },
  Search: {
    path: "/search?name=:name",
    decoder: JD.object({
      _t: JD.always("Search"),
      path: JD.always("/search?name=:name"),
      params: JD.object({
        name: maybeOptionalDecoder(JD.string),
      }),
    }),
  },
  Payment: {
    path: "/payment",
    decoder: JD.object({
      _t: JD.always("Payment"),
      path: JD.always("/payment"),
      params: JD.object({}),
    }),
  },
  PaymentResult: {
    path: "/payment/result?appTransID=:appTransID",
    decoder: JD.object({
      _t: JD.always("PaymentResult"),
      path: JD.always("/payment/result?appTransID=:appTransID"),
      params: JD.object({
        appTransID: maybeOptionalDecoder(JD.string),
      }),
    }),
  },
  WalletDeposit: {
    path: "/wallet/deposit",
    decoder: JD.object({
      _t: JD.always("WalletDeposit"),
      path: JD.always("/wallet/deposit"),
      params: JD.object({}),
    }),
  },
  UserOrders: {
    path: "/orders",
    decoder: JD.object({
      _t: JD.always("UserOrders"),
      path: JD.always("/orders"),
      params: JD.object({}),
    }),
  },
  UserReports: {
    path: "/reports",
    decoder: JD.object({
      _t: JD.always("UserReports"),
      path: JD.always("/reports"),
      params: JD.object({}),
    }),
  },
  UserReportCreate: {
    path: "/reports/new/:orderID/:sellerID",
    decoder: JD.object({
      _t: JD.always("UserReportCreate"),
      path: JD.always("/reports/new/:orderID/:sellerID"),
      params: JD.object({
        orderID: JD.string,
        sellerID: JD.string,
      }),
    }),
  },
  SellerOrders: {
    path: "/seller/orders",
    decoder: JD.object({
      _t: JD.always("SellerOrders"),
      path: JD.always("/seller/orders"),
      params: JD.object({}),
    }),
  },
  SellerReports: {
    path: "/seller/reports",
    decoder: JD.object({
      _t: JD.always("SellerReports"),
      path: JD.always("/seller/reports"),
      params: JD.object({}),
    }),
  },
  AdminReports: {
    path: "/admin/reports",
    decoder: JD.object({
      _t: JD.always("AdminReports"),
      path: JD.always("/admin/reports"),
      params: JD.object({}),
    }),
  },
  ProductDetail: {
    path: "/product/:id",
    decoder: JD.object({
      _t: JD.always("ProductDetail"),
      path: JD.always("/product/:id"),
      params: JD.object({
        id: JD.string,
      }),
    }),
  },
  SellerProfile: {
    path: "/seller/:id",
    decoder: JD.object({
      _t: JD.always("SellerProfile"),
      path: JD.always("/seller/:id"),
      params: JD.object({
        id: JD.string,
      }),
    }),
  },
  EventPoster: {
    path: "/event/:id",
    decoder: JD.object({
      _t: JD.always("EventPoster"),
      path: JD.always("/event/:id"),
      params: JD.object({
        id: JD.string,
      }),
    }),
  },
}

/**
 * Navigate to a Route
 * WARN This should be the only function used for navigation
 * If you try to use window.history.pushState directly,
 * onUrlChange will not be triggered
 */
export function navigateTo(route: Route): Action {
  return (state: State) => {
    return [
      state,
      [
        Promise.resolve().then(() => {
          // NOTE window.dispatchEvent is synchronous
          // Hence, this is wrapped in a promise
          // NOTE history.pushState does not trigger popstate event
          // so we are triggering it manually (See Subscription.ts)
          window.history.pushState(null, "", toPath(route))
          window.dispatchEvent(new PopStateEvent("popstate"))
          window.scrollTo(0, 0)
          return null
        }),
      ],
    ]
  }
}

/**
 * history.back() will trigger onUrlChange
 */
export function goBack(): Action {
  return (state: State) => {
    return [state, [Promise.resolve(history.back()).then(() => null)]]
  }
}

/**
 * Creates a Route
 *
 * Example:
 * toRoute("Login", { redirect: null })
 * => {
 *   _t: "Login",
 *   path: "/login?redirect=null",
 *   params: { redirect: null }
 * }
 */
export function toRoute<K extends keyof RouteTable>(
  routeT: K,
  params: Extract<Route, { _t: K }>["params"],
): Route {
  const routeDef = router[routeT]
  // We can guarantee this won't throw
  // based on our type definitions
  return routeDef.decoder.verify({
    _t: routeT,
    path: routeDef.path,
    // We need to _serializeParams
    // because the route decoder is targetting string params
    params: _serializeParams(params),
  })
}

/**
 * Converts a Route into a path
 */
export function toPath(route: Route): string {
  if (
    route._t === "Login" &&
    (route.params.redirect == null || route.params.redirect === "")
  ) {
    return "/login"
  }

  const routeDef = router[route._t]
  const { path } = routeDef
  const { params } = route
  // We need to convert all the param values into string
  // before we can put them into the path
  const urlParams = _serializeParams(params)
  return Teki.reverse(path)(urlParams)
}

/**
 * WARN fullUrl must be a valid full url eg. `https://example.com/login?redirect=/home`
 */
export function parseRoute(fullUrl: string): Route {
  try {
    const url = new URL(fullUrl)
    if (url.pathname === "/login") {
      const redirect = url.searchParams.get("redirect")
      if (redirect == null || redirect === "") {
        return toRoute("Login", { redirect: null })
      }
    }
  } catch (_error) {
    // Ignore URL parsing errors and fall back to router table
  }

  for (const [routeT, routeDef] of Object.entries(router)) {
    const { path, decoder } = routeDef
    const parseResult = Teki.parse(path)(fullUrl)
    if (parseResult == null) {
      continue
    }

    const route = decoder.value({
      _t: routeT,
      path,
      params: parseResult,
    })

    if (route != null) {
      return route
    }
  }

  return toRoute("NotFound", {})
}

// *** Internal ***

// Teki does not expose RouteParams
// so we are coaxing it out here
type RouteParams = NonNullable<ReturnType<ReturnType<typeof Teki.parse>>>
type NoParams = Record<string, never>

// Kept as private so that developers cannot use the path directly
type RouteTable = {
  [K in Route["_t"]]: RouteDef<Extract<Route, { _t: K }>>
}

type RouteDef<R extends Route> = {
  path: R["path"]
  decoder: JD.Decoder<
    // We want a Route decoder
    // but we also want params to be type-check against path
    // This is still essentially just a Route decoder
    R & {
      _t: R["_t"]
      path: R["path"]
      params: UrlRecord<R["path"]>
    }
  >
}

/** We need to carefully convert params into URL context
 * where number is a string, undefined to be "", etc
 */
function _serializeParams(params: Route["params"]): RouteParams {
  return JSON.parse(
    JSON.stringify(params, (_key, value) => {
      switch (typeof value) {
        case "string":
          return value
        case "number":
        case "bigint":
        case "boolean":
          // We need to set all these as string in URL
          return String(value)
        case "undefined":
        case "function":
        case "symbol":
          return ""
        case "object":
          if (value == null) {
            return ""
          } else {
            // value could be array or object
            return value
          }
      }
    }),
  )
}

// Simple test: `tsx src/Route.ts`
// console.log(
//   parseRoute(
//     "http://localhost" +
//       toPath(toRoute("Login", { redirect: toPath(toRoute("Home", {})) })),
//   ),
// )
