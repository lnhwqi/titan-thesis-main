import { cmd, type Cmd } from "../Action"
import { parseRoute } from "../Route"
import { _AuthState, _PublicState, State } from "../State"

import * as ProfileAction from "./Profile"
import * as ProductAction from "./Product"
import { parseProductID } from "../../../Core/App/Product/ProductID"

export function onUrlChange(s: State): [State, Cmd] {
  const route = parseRoute(window.location.href)
  const state = _PublicState(s, { route })

  switch (route._t) {
    case "Home":
    case "Login":
    case "NotFound":
      return [state, cmd()]

    case "Profile":
      return _AuthState(ProfileAction.onEnterRoute)(state)

    case "ProductDetail":
      try {
        const id = parseProductID(route.params.id)
        return ProductAction.loadDetail(id)(state)
      } catch (_e) {
        return [state, cmd()]
      }

    case "Search": {
      const rawName = route.params.name
      let query = ""

      if (typeof rawName === "string") {
        query = rawName
      } else if (rawName !== null && typeof rawName === "object") {
        const json = JSON.parse(JSON.stringify(rawName))
        if (json.value && typeof json.value === "string") {
          query = json.value
        }
      }

      query = decodeURIComponent(query || "").trim()

      const { searchQuery, listResponse } = state.product
      const isAlreadyLoading =
        listResponse._t === "Loading" || listResponse._t === "Success"

      if (searchQuery === query && isAlreadyLoading) {
        return [state, cmd()]
      }

      if (!query) {
        return ProductAction.loadList()(state)
      }

      return ProductAction.search(query)(state)
    }
  }
}
