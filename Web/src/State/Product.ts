import * as GetListApi from "../../../Core/Api/Public/Product/ListAll"
import * as SearchApi from "../../../Core/Api/Public/Product/Search"
import * as GetOneApi from "../../../Core/Api/Public/Product/GetOne"
import * as GetSellerProfileApi from "../../../Core/Api/Public/Seller/GetProfile"
import * as ListRatingsApi from "../../../Core/Api/Public/Product/ListRatings"
import { BasicProduct } from "../../../Core/App/ProductBasic"

import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"
import { CategoryID } from "../../../Core/App/Category/CategoryID"
import { Category } from "../../../Core/App/Category"
import type { SortByOption } from "../../../Core/Api/Public/Product/ListAll"

export type ProductState = {
  listResponse: RD.RemoteData<
    ApiError<GetListApi.ErrorCode | SearchApi.ErrorCode>,
    GetListApi.Payload | SearchApi.Payload
  >

  detailResponse: RD.RemoteData<
    ApiError<GetOneApi.ErrorCode>,
    GetOneApi.Payload
  >

  ratingsResponse: RD.RemoteData<
    ApiError<ListRatingsApi.ErrorCode>,
    ListRatingsApi.Payload
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

  // Pagination and sorting
  listPage: number
  listLimit: number
  listTotalCount: number
  listSortBy: SortByOption

  relatedListPage: number
  relatedListLimit: number
  sellerListPage: number
  sellerListLimit: number

  currentImageIndex: number
  selectedVariantSize: string | null
  selectedQuantity: number
  variantReminderVisible: boolean
  stockReminderMessage: string | null
  wishlistProductIDs: string[]
  wishlistBusy: boolean
  /** All products loaded for the detail page (related/shop-name lookup). Does not affect pagination. */
  detailProductPool: BasicProduct[]
}

export function initProductState(): ProductState {
  return {
    listResponse: RD.loading(),
    detailResponse: RD.notAsked(),
    ratingsResponse: RD.notAsked(),
    sellerProfileResponse: RD.notAsked(),
    sellerProductsResponse: RD.notAsked(),
    searchQuery: "",
    currentCategoryId: null,
    currentCategoryTree: null,
    listPage: 1,
    listLimit: 12,
    listTotalCount: 0,
    listSortBy: "newest",
    relatedListPage: 1,
    relatedListLimit: 8,
    sellerListPage: 1,
    sellerListLimit: 10,
    currentImageIndex: 0,
    selectedVariantSize: null,
    selectedQuantity: 1,
    variantReminderVisible: false,
    stockReminderMessage: null,
    wishlistProductIDs: [],
    wishlistBusy: false,
    detailProductPool: [],
  }
}

export function _ProductState(
  state: State,
  product: Partial<ProductState>,
): State {
  return { ...state, product: { ...state.product, ...product } }
}
