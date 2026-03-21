import * as GetListApi from "../../../Core/Api/Public/Product/ListAll"
import * as SearchApi from "../../../Core/Api/Public/Product/Search"
import * as GetOneApi from "../../../Core/Api/Public/Product/GetOne"
import * as GetSellerProfileApi from "../../../Core/Api/Public/Seller/GetProfile"

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

  sellerProfileResponse: RD.RemoteData<
    ApiError<GetSellerProfileApi.ErrorCode>,
    GetSellerProfileApi.Payload
  >

  sellerProductsResponse: RD.RemoteData<
    ApiError<GetListApi.ErrorCode>,
    GetListApi.Payload
  >

  searchQuery: string
  currentCategoryId: CategoryID | null
  currentCategoryTree: Category | null

  currentImageIndex: number
  selectedVariantSize: string | null
  selectedQuantity: number
  variantReminderVisible: boolean
  stockReminderMessage: string | null
  wishlistProductIDs: string[]
  wishlistBusy: boolean
}

export function initProductState(): ProductState {
  return {
    listResponse: RD.loading(),
    detailResponse: RD.notAsked(),
    sellerProfileResponse: RD.notAsked(),
    sellerProductsResponse: RD.notAsked(),
    searchQuery: "",
    currentCategoryId: null,
    currentCategoryTree: null,
    currentImageIndex: 0,
    selectedVariantSize: null,
    selectedQuantity: 1,
    variantReminderVisible: false,
    stockReminderMessage: null,
    wishlistProductIDs: [],
    wishlistBusy: false,
  }
}

export function _ProductState(
  state: State,
  product: Partial<ProductState>,
): State {
  return { ...state, product: { ...state.product, ...product } }
}
