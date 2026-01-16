import * as JD from "decoders"
import * as Teki from "teki"
import { UrlRecord } from "../../Core/Data/UrlToken"
import { Maybe, maybeOptionalDecoder } from "../../Core/Data/Maybe"
import type { Action } from "./Action"
import type { State } from "./State"

export type Route =
  | { _t: "Home"; path: "/"; params: NoParams }
  | { _t: "NotFound"; path: "/not-found"; params: NoParams }
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
      path: "/search?q=:q"
      params: {
        q: Maybe<string>
      }
    }
  | {
      _t: "ProductDetail"
      path: "/product/:id"
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
  NotFound: {
    path: "/not-found",
    decoder: JD.object({
      _t: JD.always("NotFound"),
      path: JD.always("/not-found"),
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
    path: "/search?q=:q",
    decoder: JD.object({
      _t: JD.always("Search"),
      path: JD.always("/search?q=:q"),
      params: JD.object({
        q: maybeOptionalDecoder(JD.string),
      }),
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
