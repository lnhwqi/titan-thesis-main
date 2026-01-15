import * as GetListApi from "../../../Core/Api/Public/Product/ListAll"
import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

export type ProductState = {
  listResponse: RD.RemoteData<
    ApiError<GetListApi.ErrorCode>,
    GetListApi.Payload
  >
  searchQuery: string
  currentCategoryId: CategoryID | null
}

export function initProductState(): ProductState {
  return {
    listResponse: RD.notAsked(),
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
