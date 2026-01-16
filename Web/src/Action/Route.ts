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
      return ProductAction.loadList()(state)

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

    case "Search":
      const query = route.params.q ?? ""
      return ProductAction.search(query)(state)
  }
}
