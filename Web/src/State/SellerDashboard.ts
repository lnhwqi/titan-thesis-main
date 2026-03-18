import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as CreateProductApi from "../Api/Auth/Seller/Product/Create"
import * as SellerProfileApi from "../Api/Auth/Seller/Profile"
import * as UpdateProfileApi from "../Api/Auth/Seller/UpdateProfile"

export type SellerDashboardState = {
  shopName: string
  shopDescription: string
  isEditingShop: boolean
  name: string
  categoryID: string
  price: string
  description: string
  imageUrls: string[]
  sku: string
  variantStocks: Record<"S" | "M" | "L" | "XL", string>
  createTouched: {
    name: boolean
    categoryID: boolean
    price: boolean
    description: boolean
    imageUrls: boolean
    sku: boolean
    stock: boolean
  }
  isUploadingImages: boolean
  profileResponse: RD.RemoteData<
    ApiError<SellerProfileApi.ErrorCode>,
    SellerProfileApi.Payload
  >
  updateShopResponse: RD.RemoteData<
    ApiError<UpdateProfileApi.ErrorCode>,
    UpdateProfileApi.Payload
  >
  createResponse: RD.RemoteData<
    ApiError<CreateProductApi.ErrorCode>,
    CreateProductApi.Payload
  >
  flashMessage: string | null
}

export function initCreateProductTouched(): SellerDashboardState["createTouched"] {
  return {
    name: false,
    categoryID: false,
    price: false,
    description: false,
    imageUrls: false,
    sku: false,
    stock: false,
  }
}

export function initSellerDashboardState(): SellerDashboardState {
  return {
    shopName: "",
    shopDescription: "",
    isEditingShop: false,
    name: "",
    categoryID: "",
    price: "",
    description: "",
    imageUrls: [],
    sku: "",
    variantStocks: {
      S: "",
      M: "",
      L: "",
      XL: "",
    },
    createTouched: initCreateProductTouched(),
    isUploadingImages: false,
    profileResponse: RD.notAsked(),
    updateShopResponse: RD.notAsked(),
    createResponse: RD.notAsked(),
    flashMessage: null,
  }
}

export function _SellerDashboardState(
  state: State,
  sellerDashboard: Partial<SellerDashboardState>,
): State {
  return {
    ...state,
    sellerDashboard: { ...state.sellerDashboard, ...sellerDashboard },
  }
}
