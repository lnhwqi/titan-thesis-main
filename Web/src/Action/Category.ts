import { Action, cmd } from "../Action"
import * as ListApi from "../Api/Public/Category/ListAll"
import * as GetOneApi from "../Api/Public/Category/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { _CategoryState } from "../State/Category"
import { _ProductState } from "../State/Product"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

export function loadTree(): Action {
  return (state) => {
    return [
      _CategoryState(state, {
        treeResponse: RD.loading(),
      }),
      cmd(ListApi.call().then(gotTreeResponse)),
    ]
  }
}

function gotTreeResponse(response: ListApi.Response): Action {
  return (state) => {
    return [
      _CategoryState(state, {
        treeResponse:
          response._t === "Ok"
            ? RD.success(response.value)
            : RD.failure(response.error),
      }),
      cmd(),
    ]
  }
}

export function selectCategory(categoryId: CategoryID): Action {
  return (state) => {
    let nextState = _ProductState(state, {
      currentCategoryId: categoryId,
    })

    nextState = _CategoryState(nextState, {
      detailResponse: RD.loading(),
    })

    return [
      nextState,
      cmd(GetOneApi.call({ id: categoryId }).then(gotDetailResponse)),
    ]
  }
}

function gotDetailResponse(response: GetOneApi.Response): Action {
  return (state) => {
    return [
      _CategoryState(state, {
        detailResponse:
          response._t === "Ok"
            ? RD.success(response.value)
            : RD.failure(response.error),
      }),
      cmd(),
    ]
  }
}
