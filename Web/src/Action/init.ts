import { Action, cmd, Cmd } from "../Action"
import * as UserProfileApi from "../Api/Auth/User/Profile"
import * as SellerHomeApi from "../Api/Auth/Seller/Home"
import * as AdminHomeApi from "../Api/Auth/Admin/Home"
import * as ProductApi from "../Api/Public/Product"
import { _ProductState } from "../State/Product"

import * as CategoryApi from "../Api/Public/Category/ListAll"
import { _CategoryState } from "../State/Category"

import { State } from "../State"
import * as AuthToken from "../App/AuthToken"
import { onUrlChange } from "./Route"
import {
  initAuthAdminState,
  initAuthSellerState,
  initAuthUserState,
} from "../State/init"
import * as RD from "../../../Core/Data/RemoteData"

export function initCmd(): Cmd {
  const authToken = AuthToken.get()
  if (authToken == null) {
    return initPublicCmd()
  }

  switch (authToken.role) {
    case "USER":
      return initUserCmd()
    case "SELLER":
      return initSellerCmd()
    case "ADMIN":
      return initAdminCmd()
  }
}

function initialProductCall(): Promise<ProductApi.Response> {
  return ProductApi.call({
    categoryID: "",
    name: "",
    page: 1,
    limit: 12,
    sortBy: "newest",
  })
}

function initPublicCmd(): Cmd {
  return cmd(
    Promise.all([initialProductCall(), CategoryApi.call()]).then(
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
    const productState = _ProductState(state, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
    })

    const nextState = _CategoryState(productState, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })

    return onUrlChange(nextState)
  }
}

function initUserCmd(): Cmd {
  return cmd(
    Promise.all([
      UserProfileApi.call(),
      CategoryApi.call(),
      initialProductCall(),
    ]).then(([profileRes, categoryRes, productRes]) =>
      userInitResponse(profileRes, categoryRes, productRes),
    ),
  )
}

function initSellerCmd(): Cmd {
  return cmd(
    Promise.all([
      SellerHomeApi.call(),
      CategoryApi.call(),
      initialProductCall(),
    ]).then(([homeRes, categoryRes, productRes]) =>
      sellerInitResponse(homeRes, categoryRes, productRes),
    ),
  )
}

function initAdminCmd(): Cmd {
  return cmd(
    Promise.all([
      AdminHomeApi.call(),
      CategoryApi.call(),
      initialProductCall(),
    ]).then(([homeRes, categoryRes, productRes]) =>
      adminInitResponse(homeRes, categoryRes, productRes),
    ),
  )
}

function sellerInitResponse(
  homeRes: SellerHomeApi.Response,
  categoryRes: CategoryApi.Response,
  productRes: ProductApi.Response,
): Action {
  return (state: State) => {
    if (homeRes._t === "Err") {
      return onUrlChange({ ...state, _t: "Public" })
    }

    const categoryState = _CategoryState(state, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })

    const nextState = _ProductState(categoryState, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
      currentCategoryId: null,
    })

    return onUrlChange(initAuthSellerState(homeRes.value.seller, nextState))
  }
}

function adminInitResponse(
  homeRes: AdminHomeApi.Response,
  categoryRes: CategoryApi.Response,
  productRes: ProductApi.Response,
): Action {
  return (state: State) => {
    if (homeRes._t === "Err") {
      return onUrlChange({ ...state, _t: "Public" })
    }

    const categoryState = _CategoryState(state, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })

    const nextState = _ProductState(categoryState, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
      currentCategoryId: null,
    })

    return onUrlChange(initAuthAdminState(homeRes.value.admin, nextState))
  }
}

function userInitResponse(
  profileRes: UserProfileApi.Response,
  categoryRes: CategoryApi.Response,
  productRes: ProductApi.Response,
): Action {
  return (state: State) => {
    if (profileRes._t === "Err") {
      return onUrlChange({ ...state, _t: "Public" })
    }

    const categoryState = _CategoryState(state, {
      treeResponse:
        categoryRes._t === "Ok"
          ? RD.success(categoryRes.value)
          : RD.failure(categoryRes.error),
    })
    const nextState = _ProductState(categoryState, {
      listResponse:
        productRes._t === "Ok"
          ? RD.success(productRes.value)
          : RD.failure(productRes.error),
      currentCategoryId: null, // Đảm bảo trạng thái là All Products
    })

    const authState = initAuthUserState(profileRes.value.user, nextState)
    return onUrlChange(authState)
  }
}
