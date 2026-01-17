import { Action, cmd, perform } from "../Action"
import * as ListApi from "../Api/Public/Product/ListAll"
import * as SearchApi from "../Api/Public/Product/Search"
import * as GetOneApi from "../Api/Public/Product/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { navigateTo, toRoute } from "../Route"
import { _ProductState } from "../State/Product"
import { ProductID } from "../../../Core/App/Product/ProductID"

export function loadList(params: ListApi.UrlParams = {}): Action {
  return (state) => {
    return [
      _ProductState(state, { listResponse: RD.loading(), searchQuery: "" }),
      cmd(ListApi.call(params).then(gotListResponse)),
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
