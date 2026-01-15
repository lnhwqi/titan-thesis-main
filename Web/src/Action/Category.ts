import * as ListApi from "../Api/Public/Category/ListAll"
import * as GetOneApi from "../Api/Public/Category/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { State } from "../State"
import { _CategoryState } from "../State/Category"
import { _ProductState } from "../State/ProductList"
import { CategoryID } from "../../../Core/App/Category/CategoryID"
import { Action, cmd } from "../Action"

const update =
  (newState: State): Action =>
  (_oldState) => [newState, cmd()]

// --- ACTION 1: LOAD TREE ---
export async function loadTree(
  dispatch: (action: Action) => void, // SỬA: dispatch nhận Action
  state: State,
) {
  dispatch(
    update(
      _CategoryState(state, {
        treeResponse: RD.loading(),
      }),
    ),
  )

  const response = await ListApi.call()

  if (response._t === "Ok") {
    dispatch(
      update(
        _CategoryState(state, {
          treeResponse: RD.success(response.value),
        }),
      ),
    )
  } else {
    dispatch(
      update(
        _CategoryState(state, {
          treeResponse: RD.failure(response.error),
        }),
      ),
    )
  }
}

// --- ACTION 2: SELECT CATEGORY ---
export async function selectCategory(
  dispatch: (action: Action) => void, // SỬA: dispatch nhận Action
  state: State,
  categoryId: CategoryID,
) {
  let nextState = _ProductState(state, {
    currentCategoryId: categoryId,
  })

  nextState = _CategoryState(nextState, {
    detailResponse: RD.loading(),
  })

  dispatch(update(nextState))

  const response = await GetOneApi.call({ id: categoryId })

  if (response._t === "Ok") {
    dispatch(
      update(
        _CategoryState(nextState, {
          detailResponse: RD.success(response.value),
        }),
      ),
    )
  } else {
    dispatch(
      update(
        _CategoryState(nextState, {
          detailResponse: RD.failure(response.error),
        }),
      ),
    )
  }
}
