import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as CreateProductApi from "../Api/Auth/Seller/Product/Create"
import * as SellerProfileApi from "../Api/Auth/Seller/Profile"
import * as UpdateProfileApi from "../Api/Auth/Seller/UpdateProfile"
import * as UpdateProductApi from "../Api/Auth/Seller/Product/Update"
import * as SellerOrderPaymentListApi from "../Api/Auth/Seller/OrderPayment/ListMine"

export type ShippingStatus = "PACKED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED"

export type EditVariantRow = {
  id: string | null
  name: string
  sku: string
  price: string
  stock: string
}

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
  isLoadingEditProduct: boolean
  editProductId: string | null
  editName: string
  editCategoryID: string
  editPrice: string
  editDescription: string
  editImageUrls: string[]
  editAttributes: Record<string, unknown>
  editVariants: EditVariantRow[]
  updateProductResponse: RD.RemoteData<
    ApiError<UpdateProductApi.ErrorCode>,
    UpdateProductApi.Payload
  >
  pendingDeleteProductId: string | null
  pendingDeleteProductName: string | null
  shippingStatusByProductId: Record<string, ShippingStatus>
  profileResponse: RD.RemoteData<
    ApiError<SellerProfileApi.ErrorCode>,
    SellerProfileApi.Payload
  >
  sellerOrdersStatsResponse: RD.RemoteData<
    ApiError<SellerOrderPaymentListApi.ErrorCode>,
    SellerOrderPaymentListApi.Payload
  >
  totalProductsSold: number
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
    isLoadingEditProduct: false,
    editProductId: null,
    editName: "",
    editCategoryID: "",
    editPrice: "",
    editDescription: "",
    editImageUrls: [],
    editAttributes: {},
    editVariants: [],
    updateProductResponse: RD.notAsked(),
    pendingDeleteProductId: null,
    pendingDeleteProductName: null,
    shippingStatusByProductId: {},
    profileResponse: RD.notAsked(),
    sellerOrdersStatsResponse: RD.notAsked(),
    totalProductsSold: 0,
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
