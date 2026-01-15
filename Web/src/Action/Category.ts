import * as ListApi from "../Api/Public/Category/ListAll"
import * as GetOneApi from "../Api/Public/Category/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { State } from "../State"
import { _CategoryState } from "../State/Category"
import { _ProductState } from "../State/ProductList"
// 1. IMPORT the CategoryID Type (Adjust the path to match your Core folder structure)
import { CategoryID } from "../../../Core/App/Category/CategoryID"

// --- ACTION 1: LOAD TREE (ListAll) ---
export async function loadTree(dispatch: (state: State) => void, state: State) {
  dispatch(
    _CategoryState(state, {
      treeResponse: RD.loading(),
    }),
  )

  const response = await ListApi.call()

  if (response._t === "Ok") {
    dispatch(
      _CategoryState(state, {
        treeResponse: RD.success(response.value),
      }),
    )
  } else {
    dispatch(
      _CategoryState(state, {
        treeResponse: RD.failure(response.error),
      }),
    )
  }
}

// --- ACTION 2: SELECT CATEGORY (GetOne) ---
export async function selectCategory(
  dispatch: (state: State) => void,
  state: State,
  categoryId: CategoryID,
) {
  let nextState = _ProductState(state, {
    currentCategoryId: categoryId,
  })

  nextState = _CategoryState(nextState, {
    detailResponse: RD.loading(),
  })

  dispatch(nextState)

  const response = await GetOneApi.call({ id: categoryId })

  if (response._t === "Ok") {
    dispatch(
      _CategoryState(nextState, {
        detailResponse: RD.success(response.value),
      }),
    )
  } else {
    dispatch(
      _CategoryState(nextState, {
        detailResponse: RD.failure(response.error),
      }),
    )
  }
}
