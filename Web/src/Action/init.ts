import { Action, cmd, Cmd } from "../Action"
import * as ProfileApi from "../Api/Auth/User/Profile"
import * as ProductApi from "../Api/Public/Product"
import { _ProductState } from "../State/Product"

import * as CategoryApi from "../Api/Public/Category/ListAll"
import { _CategoryState } from "../State/Category"

import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { onUrlChange } from "./Route"
import { initAuthState } from "../State/init"
import * as RD from "../../../Core/Data/RemoteData"

export function initCmd(): Cmd {
  const authToken = AuthToken.get()
  if (authToken == null) {
    return initPublicCmd()
  }

  switch (authToken.role) {
    case "USER":
      return initAuthCmd()
    case "SELLER":
    case "ADMIN":
      return initRoleBootstrapCmd()
  }
}

function initPublicCmd(): Cmd {
  return cmd(
    Promise.all([
      ProductApi.call({
        categoryID: "",
        name: "",
        page: 1,
        limit: 12,
        sortBy: "newest",
      }),
      CategoryApi.call(),
    ]).then(([productRes, categoryRes]) =>
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

    return onUrlChange(nextState)
  }
}

function initAuthCmd(): Cmd {
  return cmd(
    Promise.all([
      ProfileApi.call(),
      CategoryApi.call(),
      ProductApi.call({
        categoryID: "",
        name: "",
        page: 1,
        limit: 12,
        sortBy: "newest",
      }),
    ]).then(([profileRes, categoryRes, productRes]) =>
      authInitResponse(profileRes, categoryRes, productRes),
    ),
  )
}

function initRoleBootstrapCmd(): Cmd {
  return cmd(
    Promise.all([
      CategoryApi.call(),
      ProductApi.call({
        categoryID: "",
        name: "",
        page: 1,
        limit: 12,
        sortBy: "newest",
      }),
    ]).then(([categoryRes, productRes]) =>
      roleBootstrapResponse(categoryRes, productRes),
    ),
  )
}

function roleBootstrapResponse(
  categoryRes: CategoryApi.Response,
  productRes: ProductApi.Response,
): Action {
  return (state: State) => {
    let nextState = _CategoryState(state, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })

    nextState = _ProductState(nextState, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
      currentCategoryId: null,
    })

    // Keep non-user sessions (seller/admin) functional after refresh.
    return onUrlChange({ ...nextState, _t: "Public" })
  }
}

function authInitResponse(
  profileRes: ProfileApi.Response,
  categoryRes: CategoryApi.Response,
  productRes: ProductApi.Response,
): Action {
  return (state: State) => {
    if (profileRes._t === "Err") {
      return onUrlChange({ ...state, _t: "Public" })
    }

    let nextState = _CategoryState(state, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })
    nextState = _ProductState(nextState, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
      currentCategoryId: null, // Đảm bảo trạng thái là All Products
    })

    const authState = initAuthState(profileRes.value.user, nextState)
    return onUrlChange(authState)
  }
}
