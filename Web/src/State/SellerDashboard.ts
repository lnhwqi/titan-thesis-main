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
  price: string
  description: string
  imageUrl: string
  sku: string
  stock: string
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

export function initSellerDashboardState(): SellerDashboardState {
  return {
    shopName: "",
    shopDescription: "",
    isEditingShop: false,
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    sku: "",
    stock: "",
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
