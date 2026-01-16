import * as GetListApi from "../../../Core/Api/Public/Product/ListAll"
import * as SearchApi from "../../../Core/Api/Public/Product/Search"
// 1. Import API GetOne
import * as GetOneApi from "../../../Core/Api/Public/Product/GetOne"

import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

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
}

export function initProductState(): ProductState {
  return {
    listResponse: RD.notAsked(),
    detailResponse: RD.notAsked(),
    searchQuery: "",
    currentCategoryId: null,
  }
}

export function _ProductState(
  state: State,
  product: Partial<ProductState>,
): State {
  return { ...state, product: { ...state.product, ...product } }
}
