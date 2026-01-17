import * as GetListApi from "../../../Core/Api/Public/Product/ListAll"
import * as SearchApi from "../../../Core/Api/Public/Product/Search"
// 1. Import API GetOne
import * as GetOneApi from "../../../Core/Api/Public/Product/GetOne"

import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"
import { CategoryID } from "../../../Core/App/Category/CategoryID"
import { Category } from "../../../Core/App/Category"

export type ProductState = {
  listResponse: RD.RemoteData<
    ApiError<GetListApi.ErrorCode | SearchApi.ErrorCode>,
    GetListApi.Payload | SearchApi.Payload
  >

  detailResponse: RD.RemoteData<
    ApiError<GetOneApi.ErrorCode>,
    GetOneApi.Payload
  >

  searchQuery: string
  currentCategoryId: CategoryID | null
  currentCategoryTree: Category | null
}

export function initProductState(): ProductState {
  return {
    listResponse: RD.loading(),
    detailResponse: RD.notAsked(),
    searchQuery: "",
    currentCategoryId: null,
    currentCategoryTree: null,
  }
}

export function _ProductState(
  state: State,
  product: Partial<ProductState>,
): State {
  return { ...state, product: { ...state.product, ...product } }
}
