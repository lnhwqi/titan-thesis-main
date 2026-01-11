import * as GetListApi from "../../../Core/Api/Public/Product/GetList"
import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"

export type ProductState = {
  listResponse: RD.RemoteData<ApiError<GetListApi.ErrorCode>, GetListApi.Payload>
  searchQuery: string
}

export function initProductState(): ProductState {
  return {
    listResponse: RD.notAsked(),
    searchQuery: "",
  }
}

export function _ProductState(state: State, product: Partial<ProductState>): State {
  return { ...state, product: { ...state.product, ...product } }
}