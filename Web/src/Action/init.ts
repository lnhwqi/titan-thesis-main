import { Action, cmd, Cmd } from "../Action"
import * as ProfileApi from "../Api/Auth/Profile"
import * as ProductApi from "../Api/Public/Product"
import { _ProductState } from "../State/ProductList"

import * as CategoryApi from "../Api/Public/Category/ListAll"
import { _CategoryState } from "../State/Category"

import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { onUrlChange } from "./Route"
import { initAuthState } from "../State/init"
import * as RD from "../../../Core/Data/RemoteData"

export function initCmd(): Cmd {
  const authToken = AuthToken.get()
  return authToken == null ? initPublicCmd() : initAuthCmd()
}

function initPublicCmd(): Cmd {
  return cmd(
    Promise.all([ProductApi.call({}), CategoryApi.call()]).then(
      ([productRes, categoryRes]) =>
        publicInitResponse(productRes, categoryRes),
    ),
  )
}

function publicInitResponse(
  productRes: ProductApi.Response,
  categoryRes: CategoryApi.Response,
): Action {
  return (state: State) => {
    let nextState = _ProductState(state, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
    })

    nextState = _CategoryState(nextState, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })

    return [nextState, cmd()]
  }
}

function initAuthCmd(): Cmd {
  return cmd(
    Promise.all([ProfileApi.call(), CategoryApi.call()]).then(
      ([profileRes, categoryRes]) => authInitResponse(profileRes, categoryRes),
    ),
  )
}

function authInitResponse(
  profileRes: ProfileApi.Response,
  categoryRes: CategoryApi.Response,
): Action {
  return (state: State) => {
    if (profileRes._t === "Err") {
      return [{ ...state, _t: "Public" }, cmd()]
    }

    const nextState = _CategoryState(state, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })

    const authState = initAuthState(profileRes.value.user, nextState)
    return onUrlChange(authState)
  }
}
