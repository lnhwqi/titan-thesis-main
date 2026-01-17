import { Action, cmd, perform } from "../Action"
import * as ListApi from "../Api/Public/Product/ListAll"
import * as SearchApi from "../Api/Public/Product/Search"
import * as GetOneApi from "../Api/Public/Product/GetOne"
import * as CategoryGetOneApi from "../Api/Public/Category/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { navigateTo, toRoute } from "../Route"
import { _ProductState } from "../State/Product"
import { ProductID } from "../../../Core/App/Product/ProductID"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

export function loadList(params: ListApi.UrlParams = {}): Action {
  return (state) => {
    return [
      _ProductState(state, { listResponse: RD.loading(), searchQuery: "" }),
      cmd(ListApi.call(params).then(gotListResponse)),
    ]
  }
}
export function selectCategory(categoryId: CategoryID | null): Action {
  return (state) => {
    const { currentCategoryTree } = state.product

    // Kiểm tra xem ID mới bấm có phải là con của Category hiện tại đang mở không
    const isChildOfCurrent =
      currentCategoryTree &&
      currentCategoryTree.children.some(
        (child) => child.id.unwrap() === categoryId?.unwrap(),
      )

    // 1. Cập nhật State tức thì
    const nextState = _ProductState(state, {
      currentCategoryId: categoryId,
      listResponse: RD.loading(),
      // CHỈ RESET nếu không phải là con của cây hiện tại
      currentCategoryTree: isChildOfCurrent ? currentCategoryTree : null,
      searchQuery: "",
    })

    if (categoryId === null) {
      return [nextState, cmd(ListApi.call({}).then(gotListResponse))]
    }

    // 2. Load sản phẩm
    const loadProductsCmd = cmd(
      ListApi.call({ categoryID: categoryId.toString() }).then(gotListResponse),
    )

    // 3. CHỈ LOAD cây mới nếu danh mục này không phải là con (tức là nhấn vào một cha mới)
    const loadSubCategoriesCmd = isChildOfCurrent
      ? []
      : cmd(
          CategoryGetOneApi.call({ id: categoryId }).then(
            gotCategoryDetailResponse,
          ),
        )

    return [nextState, [...loadProductsCmd, ...loadSubCategoriesCmd]]
  }
}
function gotCategoryDetailResponse(
  response: CategoryGetOneApi.Response,
): Action {
  return (state) => {
    return [
      _ProductState(state, {
        // Nếu API thành công, lưu thông tin category (bao gồm children) vào state
        currentCategoryTree: response._t === "Ok" ? response.value : null,
      }),
      cmd(),
    ]
  }
}
function gotListResponse(
  response: ListApi.Response | SearchApi.Response,
): Action {
  return (state) => {
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
  return (state) => {
    return [
      _ProductState(state, {
        searchQuery: query,
      }),
      cmd(),
    ]
  }
}
export function search(query: string): Action {
  return (state) => {
    return [
      _ProductState(state, {
        listResponse: RD.loading(),
        searchQuery: query,
      }),
      cmd(SearchApi.call({ name: query }).then(gotListResponse)),
    ]
  }
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
  return (state) => {
    return [
      _ProductState(state, {
        detailResponse:
          response._t === "Ok"
            ? RD.success(response.value)
            : RD.failure(response.error),
      }),
      cmd(),
    ]
  }
}
export function loadDetail(id: ProductID): Action {
  return (state) => {
    return [
      _ProductState(state, { detailResponse: RD.loading() }),
      cmd(GetOneApi.call({ id }).then(gotDetailResponse)),
    ]
  }
}
