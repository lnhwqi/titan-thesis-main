import { Action, cmd, perform } from "../Action"
import * as ListAllApi from "../Api/Public/Product/ListAll"
import * as SearchApi from "../Api/Public/Product/Search"
import * as GetOneApi from "../Api/Public/Product/GetOne"
import * as CategoryGetOneApi from "../Api/Public/Category/GetOne"
import * as WishlistListApi from "../Api/Auth/User/Wishlist/List"
import * as WishlistSaveApi from "../Api/Auth/User/Wishlist/Save"
import * as WishlistRemoveApi from "../Api/Auth/User/Wishlist/Remove"
import * as RD from "../../../Core/Data/RemoteData"
import { navigateTo, toRoute } from "../Route"
import { _ProductState } from "../State/Product"
import { ProductID } from "../../../Core/App/Product/ProductID"
import { CategoryID } from "../../../Core/App/Category/CategoryID"
import * as AuthToken from "../App/AuthToken"

export function loadList(params: ListAllApi.UrlParams = {}): Action {
  return (state) => {
    const expected = params.name || params.categoryID || ""
    return [
      _ProductState(state, { listResponse: RD.loading(), searchQuery: "" }),
      cmd(
        ListAllApi.call(params).then((res) => gotListResponse(res, expected)),
      ),
    ]
  }
}

export function selectCategory(categoryId: CategoryID | null): Action {
  return selectCategoryWithNavigation(categoryId, true)
}

export function selectCategoryFromRoute(categoryId: CategoryID): Action {
  return selectCategoryWithNavigation(categoryId, false)
}

function selectCategoryWithNavigation(
  categoryId: CategoryID | null,
  shouldNavigate: boolean,
): Action {
  return (state) => {
    const { currentCategoryTree } = state.product
    const isChildOfCurrent =
      currentCategoryTree &&
      currentCategoryTree.children?.some(
        (child) => child.id.unwrap() === categoryId?.unwrap(),
      )

    const nextState = _ProductState(state, {
      currentCategoryId: categoryId,
      listResponse: RD.loading(),
      currentCategoryTree: isChildOfCurrent ? currentCategoryTree : null,
      searchQuery: "",
    })

    if (categoryId === null) {
      return [
        nextState,
        cmd(ListAllApi.call({}).then((res) => gotListResponse(res, ""))),
      ]
    }

    const expectedId = categoryId.toString()
    const loadProductsCmd = cmd(
      ListAllApi.call({ categoryID: expectedId }).then((res) =>
        gotListResponse(res, expectedId),
      ),
    )

    const navigateCmd = shouldNavigate
      ? cmd(perform(navigateTo(toRoute("Home", {}))))
      : cmd()

    const loadSubCategoriesCmd = isChildOfCurrent
      ? []
      : cmd(
          CategoryGetOneApi.call({ id: categoryId }).then(
            gotCategoryDetailResponse,
          ),
        )

    return [
      nextState,
      [...loadProductsCmd, ...navigateCmd, ...loadSubCategoriesCmd],
    ]
  }
}

function gotCategoryDetailResponse(
  response: CategoryGetOneApi.Response,
): Action {
  return (state) => [
    _ProductState(state, {
      currentCategoryTree: response._t === "Ok" ? response.value : null,
    }),
    cmd(),
  ]
}

function gotListResponse(
  response: ListAllApi.Response | SearchApi.Response,
  expectedQueryOrId: string,
): Action {
  return (state) => {
    const isStale =
      (state.product.searchQuery || "") !== expectedQueryOrId &&
      (state.product.currentCategoryId?.toString() || "") !== expectedQueryOrId

    if (isStale) {
      return [state, cmd()]
    }

    return [
      _ProductState(state, {
        listResponse:
          response._t === "Ok"
            ? RD.success(response.value)
            : RD.failure(response.error),
      }),
      cmd(),
    ]
  }
}

export function onChangeQuery(query: string): Action {
  return (state) => [_ProductState(state, { searchQuery: query }), cmd()]
}

export function search(query: string): Action {
  return (state) => [
    _ProductState(state, {
      listResponse: RD.loading(),
      searchQuery: query,
    }),
    cmd(
      SearchApi.call({ name: query }).then((res) =>
        gotListResponse(res, query),
      ),
    ),
  ]
}

export function submitSearch(query: string): Action {
  return (state) => {
    if (!query.trim()) return [state, cmd()]

    const nextState = _ProductState(state, {
      listResponse: RD.loading(),
      searchQuery: query,
    })

    const apiCallCmd = cmd(
      SearchApi.call({ name: query }).then((res) =>
        gotListResponse(res, query),
      ),
    )

    const navigateCmd = cmd(
      perform(navigateTo(toRoute("Search", { name: query }))),
    )

    return [nextState, [...apiCallCmd, ...navigateCmd]]
  }
}

function gotDetailResponse(response: GetOneApi.Response): Action {
  return (state) => [
    _ProductState(state, {
      detailResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function gotWishlistListResponse(response: WishlistListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, {
          wishlistBusy: false,
        }),
        cmd(),
      ]
    }

    return [
      _ProductState(state, {
        wishlistProductIDs: response.value.productIDs.map((id) => id.unwrap()),
        wishlistBusy: false,
      }),
      cmd(),
    ]
  }
}

export function loadWishlist(): Action {
  return (state) => {
    const auth = AuthToken.get()
    if (auth == null || auth.role !== "USER") {
      return [_ProductState(state, { wishlistProductIDs: [] }), cmd()]
    }

    return [
      _ProductState(state, { wishlistBusy: true }),
      cmd(WishlistListApi.call().then(gotWishlistListResponse)),
    ]
  }
}

export function loadDetail(id: ProductID): Action {
  return (state) => {
    const auth = AuthToken.get()
    const shouldLoadWishlist = auth != null && auth.role === "USER"

    return [
      _ProductState(state, {
        detailResponse: RD.loading(),
        currentImageIndex: 0,
        selectedVariantSize: null,
        wishlistBusy: false,
        wishlistProductIDs: shouldLoadWishlist
          ? state.product.wishlistProductIDs
          : [],
      }),
      (() => {
        const wishlistCmd = shouldLoadWishlist
          ? cmd(WishlistListApi.call().then(gotWishlistListResponse))
          : cmd()

        return [
          ...cmd(GetOneApi.call({ id }).then(gotDetailResponse)),
          ...cmd(
            ListAllApi.call({ page: 1, limit: 200 }).then((res) =>
              gotListResponse(res, ""),
            ),
          ),
          ...wishlistCmd,
        ]
      })(),
    ]
  }
}

export function setImageIndex(index: number): Action {
  return (state) => [_ProductState(state, { currentImageIndex: index }), cmd()]
}

export function setSelectedVariantSize(size: string | null): Action {
  return (state) => [_ProductState(state, { selectedVariantSize: size }), cmd()]
}

export function saveToWishlist(productID: ProductID): Action {
  return (state) => {
    const auth = AuthToken.get()
    if (auth == null || auth.role !== "USER") {
      return [state, cmd()]
    }

    return [
      _ProductState(state, { wishlistBusy: true }),
      cmd(WishlistSaveApi.call({ productID }).then(onSaveWishlistResponse)),
    ]
  }
}

function onSaveWishlistResponse(response: WishlistSaveApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [_ProductState(state, { wishlistBusy: false }), cmd()]
    }

    const id = response.value.productID.unwrap()
    const hasID = state.product.wishlistProductIDs.includes(id)

    return [
      _ProductState(state, {
        wishlistBusy: false,
        wishlistProductIDs: hasID
          ? state.product.wishlistProductIDs
          : [...state.product.wishlistProductIDs, id],
      }),
      cmd(),
    ]
  }
}

export function removeFromWishlist(productID: ProductID): Action {
  return (state) => {
    const auth = AuthToken.get()
    if (auth == null || auth.role !== "USER") {
      return [state, cmd()]
    }

    return [
      _ProductState(state, { wishlistBusy: true }),
      cmd(WishlistRemoveApi.call({ productID }).then(onRemoveWishlistResponse)),
    ]
  }
}

function onRemoveWishlistResponse(
  response: WishlistRemoveApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [_ProductState(state, { wishlistBusy: false }), cmd()]
    }

    const id = response.value.productID.unwrap()

    return [
      _ProductState(state, {
        wishlistBusy: false,
        wishlistProductIDs: state.product.wishlistProductIDs.filter(
          (x) => x !== id,
        ),
      }),
      cmd(),
    ]
  }
}
