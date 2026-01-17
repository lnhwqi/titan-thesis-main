import { Action, cmd, perform } from "../Action"
import * as ListAllApi from "../Api/Public/Product/ListAll"
import * as SearchApi from "../Api/Public/Product/Search"
import * as GetOneApi from "../Api/Public/Product/GetOne"
import * as CategoryGetOneApi from "../Api/Public/Category/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { navigateTo, toRoute } from "../Route"
import { _ProductState } from "../State/Product"
import { ProductID } from "../../../Core/App/Product/ProductID"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

export function loadList(params: ListAllApi.UrlParams = {}): Action {
  return (state) => [
    _ProductState(state, { listResponse: RD.loading(), searchQuery: "" }),
    cmd(ListAllApi.call(params).then(gotListResponse)),
  ]
}

export function selectCategory(categoryId: CategoryID | null): Action {
  return (state) => {
    const { currentCategoryTree } = state.product
    const isChildOfCurrent =
      currentCategoryTree &&
      currentCategoryTree.children.some(
        (child) => child.id.unwrap() === categoryId?.unwrap(),
      )

    const nextState = _ProductState(state, {
      currentCategoryId: categoryId,
      listResponse: RD.loading(),
      currentCategoryTree: isChildOfCurrent ? currentCategoryTree : null,
      searchQuery: "",
    })

    if (categoryId === null) {
      return [nextState, cmd(ListAllApi.call({}).then(gotListResponse))]
    }

    const loadProductsCmd = cmd(
      ListAllApi.call({ categoryID: categoryId.toString() }).then(
        gotListResponse,
      ),
    )
    const navigateCmd = cmd(perform(navigateTo(toRoute("Home", {}))))
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
): Action {
  return (state) => [
    _ProductState(state, {
      listResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
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
    cmd(SearchApi.call({ name: query }).then(gotListResponse)),
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
      SearchApi.call({ name: query }).then(gotListResponse),
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

export function loadDetail(id: ProductID): Action {
  return (state) => [
    _ProductState(state, {
      detailResponse: RD.loading(),
      currentImageIndex: 0,
    }),
    cmd(GetOneApi.call({ id }).then(gotDetailResponse)),
  ]
}

export function setImageIndex(index: number): Action {
  return (state) => [_ProductState(state, { currentImageIndex: index }), cmd()]
}
