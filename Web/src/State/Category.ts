import * as CategoryListApi from "../../../Core/Api/Public/Category/ListAll"
import * as CategoryGetOneApi from "../../../Core/Api/Public/Category/GetOne"
import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"

export type CategoryState = {
  treeResponse: RD.RemoteData<
    ApiError<CategoryListApi.ErrorCode>,
    CategoryListApi.Payload
  >
  detailResponse: RD.RemoteData<
    ApiError<CategoryGetOneApi.ErrorCode>,
    CategoryGetOneApi.Payload
  >
  isOpen: boolean
}

export function initCategoryState(): CategoryState {
  return {
    treeResponse: RD.notAsked(),
    detailResponse: RD.notAsked(),
  }
}

export function _CategoryState(
  state: State,
  category: Partial<CategoryState>,
): State {
  return { ...state, category: { ...state.category, ...category } }
}
