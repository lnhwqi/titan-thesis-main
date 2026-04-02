import * as RD from "../../../Core/Data/RemoteData"
import * as JD from "decoders"
import { Annotation } from "../../../Core/Data/Decoder"
import { Action, cmd, perform } from "../Action"
import * as CreateProductApi from "../Api/Auth/Seller/Product/Create"
import * as SellerProfileApi from "../Api/Auth/Seller/Profile"
import * as UpdateProfileApi from "../Api/Auth/Seller/UpdateProfile"
import * as UploadImagesApi from "../Api/Auth/Seller/Product/UploadImages"
import * as UpdateProductApi from "../Api/Auth/Seller/Product/Update"
import * as DeleteProductApi from "../Api/Auth/Seller/Product/Delete"
import * as SellerOrderPaymentListApi from "../Api/Auth/Seller/OrderPayment/ListMine"
import * as ProductGetOneApi from "../Api/Public/Product/GetOne"
import * as ProductListApi from "../Api/Public/Product/ListAll"
import * as CategoryAction from "./Category"
import { Category } from "../../../Core/App/Category"
import { createStockE } from "../../../Core/App/ProductVariant/Stock"
import { parseProductID, ProductID } from "../../../Core/App/Product/ProductID"
import { _ProductState } from "../State/Product"
import { navigateTo, toRoute } from "../Route"
import type { State } from "../State"
import {
  CreateVariantMode,
  _SellerDashboardState,
  EditVariantRow,
  initCreateProductTouched,
  ShippingStatus,
} from "../State/SellerDashboard"

export const MAX_PRODUCT_IMAGES = 5
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
type PresetVariantSize = "S" | "M" | "L" | "XL"
const PRESET_VARIANT_SIZES: PresetVariantSize[] = ["S", "M", "L", "XL"]

export function onEnterRoute(): Action {
  return (state) => {
    const [nextState, categoryCmd] = CategoryAction.loadTree()(state)
    return [
      _SellerDashboardState(nextState, {
        profileResponse: RD.loading(),
        sellerOrdersStatsResponse: RD.loading(),
        totalProductsSold: 0,
        flashMessage: null,
      }),
      [
        ...categoryCmd,
        SellerProfileApi.call().then(onLoadSellerProfileResponse),
        ProductListApi.call({}).then(onLoadProductListResponse),
        SellerOrderPaymentListApi.call().then(onLoadSellerOrdersStatsResponse),
      ],
    ]
  }
}

export function goToCreateProductPage(): Action {
  return (state) => [
    state,
    cmd(perform(navigateTo(toRoute("SellerProductCreate", {})))),
  ]
}

export function goToEditProductPage(productID: ProductID): Action {
  return (state) => [
    state,
    cmd(
      perform(
        navigateTo(toRoute("SellerProductEdit", { id: productID.unwrap() })),
      ),
    ),
  ]
}

export function goToShippingPage(): Action {
  return (state) => [
    state,
    cmd(perform(navigateTo(toRoute("SellerShipping", {})))),
  ]
}

export function goToCreateVoucherPage(): Action {
  return (state) => [
    state,
    cmd(perform(navigateTo(toRoute("SellerVoucherCreate", {})))),
  ]
}

export function onEnterEditRoute(id: ProductID): Action {
  return (state) => [
    _SellerDashboardState(state, {
      isLoadingEditProduct: true,
      flashMessage: null,
      updateProductResponse: RD.notAsked(),
    }),
    cmd(ProductGetOneApi.call({ id }).then(onLoadProductForEditResponse)),
  ]
}

function onLoadProductForEditResponse(
  response: ProductGetOneApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          isLoadingEditProduct: false,
          flashMessage: ProductGetOneApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const product = response.value
    const variants: EditVariantRow[] = product.variants.map((variant) => ({
      id: variant.id.unwrap(),
      name: variant.name.unwrap(),
      sku: variant.sku.unwrap(),
      price: String(variant.price.unwrap()),
      stock: String(variant.stock.unwrap()),
    }))

    return [
      _SellerDashboardState(state, {
        isLoadingEditProduct: false,
        editProductId: product.id.unwrap(),
        editName: product.name.unwrap(),
        editCategoryID: product.categoryID.unwrap(),
        editPrice: String(product.price.unwrap()),
        editDescription: product.description.unwrap(),
        editImageUrls: product.urls.map((url) => url.unwrap()),
        editAttributes: normalizeAttributesForUpdate(product.attributes),
        editVariants: variants,
      }),
      cmd(),
    ]
  }
}

export function onChangeEditName(value: string): Action {
  return (state) => [_SellerDashboardState(state, { editName: value }), cmd()]
}

export function onChangeEditCategoryID(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, { editCategoryID: value }),
    cmd(),
  ]
}

export function onChangeEditPrice(value: string): Action {
  return (state) => [_SellerDashboardState(state, { editPrice: value }), cmd()]
}

export function onChangeEditDescription(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, { editDescription: value }),
    cmd(),
  ]
}

export function onChangeEditVariant(
  index: number,
  key: keyof EditVariantRow,
  value: string,
): Action {
  return (state) => {
    const next = state.sellerDashboard.editVariants.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item,
    )
    return [_SellerDashboardState(state, { editVariants: next }), cmd()]
  }
}

export function addEditImageUrl(): Action {
  return (state) => {
    if (typeof window === "undefined") {
      return [state, cmd()]
    }

    const input = window.prompt("Paste image URL")
    if (input == null) {
      return [state, cmd()]
    }

    const value = input.trim()
    if (value === "") {
      return [state, cmd()]
    }

    return [
      _SellerDashboardState(state, {
        editImageUrls: [...state.sellerDashboard.editImageUrls, value],
      }),
      cmd(),
    ]
  }
}

export function removeEditImageUrl(url: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      editImageUrls: state.sellerDashboard.editImageUrls.filter(
        (item) => item !== url,
      ),
    }),
    cmd(),
  ]
}

export function uploadEditProductImages(files: File[]): Action {
  return (state) => {
    const remainingSlots =
      MAX_PRODUCT_IMAGES - state.sellerDashboard.editImageUrls.length

    if (remainingSlots <= 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage: `You can upload up to ${MAX_PRODUCT_IMAGES} images per product.`,
        }),
        cmd(),
      ]
    }

    const selected = files.slice(0, remainingSlots)
    const { acceptedFiles, warning } = filterUploadFiles(selected)

    if (acceptedFiles.length === 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            warning ??
            `Select at least one valid image under ${MAX_UPLOAD_SIZE_MB} MB.`,
        }),
        cmd(),
      ]
    }

    const nextState = _SellerDashboardState(state, {
      isUploadingImages: true,
      flashMessage: warning,
    })

    const uploadCmd = readFilesAsDataUrl(acceptedFiles)
      .then((payload) => UploadImagesApi.call({ files: payload }))
      .then(onUploadEditImagesResponse)
      .catch(() => onUploadImagesReadFailed())

    return [nextState, cmd(uploadCmd)]
  }
}

export function submitEditProductFromPage(): Action {
  return (state) => {
    const rawID = state.sellerDashboard.editProductId
    if (rawID == null) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "No product selected for editing.",
        }),
        cmd(),
      ]
    }

    let productID: ProductID
    try {
      productID = parseProductID(rawID)
    } catch (_e) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "Invalid product id.",
        }),
        cmd(),
      ]
    }

    const availableCategoryIDs =
      state.category.treeResponse._t === "Success"
        ? flattenCategoryIDs(state.category.treeResponse.data)
        : []

    if (availableCategoryIDs.length === 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            "No category available yet. Please create categories first.",
        }),
        cmd(),
      ]
    }

    const categoryID = state.sellerDashboard.editCategoryID.trim()
    if (
      categoryID === "" ||
      availableCategoryIDs.includes(categoryID) === false
    ) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "Please select a valid category for this product.",
        }),
        cmd(),
      ]
    }

    const fallbackPrice = Number(state.sellerDashboard.editPrice)
    const safePrice = Number.isFinite(fallbackPrice) ? fallbackPrice : 0

    if (state.sellerDashboard.editName.trim() === "") {
      return [
        _SellerDashboardState(state, {
          flashMessage: "Product name is required.",
        }),
        cmd(),
      ]
    }

    const normalizedVariants = state.sellerDashboard.editVariants.map(
      (variant, index) => {
        const rawPrice = Number(variant.price)
        const rawStock = Number(variant.stock)
        const rawName = variant.name.trim()
        const rawSku = variant.sku.trim()

        const name =
          rawName === ""
            ? `${state.sellerDashboard.editName.trim()} Variant ${index + 1}`
            : rawName

        const sku =
          rawSku === ""
            ? `${state.sellerDashboard.editName.trim().replace(/\s+/g, "-").toUpperCase()}-${index + 1}`
            : rawSku

        return {
          // Force null so decoder does not fail on legacy/non-UUID ids.
          id: null,
          name,
          sku,
          price: Number.isFinite(rawPrice) ? rawPrice : safePrice,
          stock: Number.isFinite(rawStock) ? rawStock : 0,
        }
      },
    )

    const normalizedImageUrls = state.sellerDashboard.editImageUrls
      .map((url) => url.trim())
      .filter((url) => url !== "")

    if (normalizedImageUrls.length === 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "At least one image is required.",
        }),
        cmd(),
      ]
    }

    if (normalizedVariants.length === 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "At least one variant is required.",
        }),
        cmd(),
      ]
    }

    const bodyCandidate = {
      name: state.sellerDashboard.editName,
      price: safePrice,
      description: state.sellerDashboard.editDescription,
      urls: normalizedImageUrls,
      categoryID,
      attributes: normalizeAttributesForUpdate(
        state.sellerDashboard.editAttributes,
      ),
      variants: normalizedVariants,
    }

    const decoded = UpdateProductApi.bodyParamsDecoder.decode(bodyCandidate)
    if (decoded.ok === false) {
      return [
        _SellerDashboardState(state, {
          flashMessage: `Invalid edit input: ${formatDecodeError(decoded.error)}`,
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        updateProductResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        UpdateProductApi.call({ id: productID }, decoded.value).then(
          onEditPageUpdateResponse,
        ),
      ),
    ]
  }
}

function onEditPageUpdateResponse(response: UpdateProductApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          updateProductResponse: RD.failure(response.error),
          flashMessage: UpdateProductApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        updateProductResponse: RD.success(response.value),
        flashMessage: "Product updated successfully.",
      }),
      cmd(ProductListApi.call({}).then(onLoadProductListResponse)),
    ]
  }
}

export function setShippingStatus(
  productID: ProductID,
  status: ShippingStatus,
): Action {
  return (state) => [
    _SellerDashboardState(state, {
      shippingStatusByProductId: {
        ...state.sellerDashboard.shippingStatusByProductId,
        [productID.unwrap()]: status,
      },
    }),
    cmd(),
  ]
}

function onLoadProductListResponse(response: ProductListApi.Response): Action {
  return (state) => [
    _ProductState(state, {
      listResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function onLoadSellerProfileResponse(
  response: SellerProfileApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          profileResponse: RD.failure(response.error),
          flashMessage: "Failed to load shop profile.",
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        profileResponse: RD.success(response.value),
        shopName: response.value.seller.shopName.unwrap(),
        shopDescription: response.value.seller.shopDescription.unwrap(),
      }),
      cmd(),
    ]
  }
}

function onLoadSellerOrdersStatsResponse(
  response: SellerOrderPaymentListApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          sellerOrdersStatsResponse: RD.failure(response.error),
          totalProductsSold: 0,
        }),
        cmd(),
      ]
    }

    const totalProductsSold = response.value.orders.filter(
      (order) => order.isPaid,
    ).length

    return [
      _SellerDashboardState(state, {
        sellerOrdersStatsResponse: RD.success(response.value),
        totalProductsSold,
      }),
      cmd(),
    ]
  }
}

export function startEditShop(): Action {
  return (state) => [
    _SellerDashboardState(state, {
      isEditingShop: true,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function cancelEditShop(): Action {
  return (state) => {
    if (state.sellerDashboard.profileResponse._t !== "Success") {
      return [
        _SellerDashboardState(state, {
          isEditingShop: false,
          flashMessage: null,
        }),
        cmd(),
      ]
    }

    const seller = state.sellerDashboard.profileResponse.data.seller

    return [
      _SellerDashboardState(state, {
        isEditingShop: false,
        shopName: seller.shopName.unwrap(),
        shopDescription: seller.shopDescription.unwrap(),
        flashMessage: null,
      }),
      cmd(),
    ]
  }
}

export function onChangeShopName(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      shopName: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeShopDescription(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      shopDescription: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function submitShopProfile(): Action {
  return (state) => {
    const decoded = UpdateProfileApi.paramsDecoder.decode({
      shopName: state.sellerDashboard.shopName,
      shopDescription: state.sellerDashboard.shopDescription,
    })

    if (decoded.ok === false) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "Invalid shop profile data.",
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        updateShopResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(UpdateProfileApi.call(decoded.value).then(onUpdateShopResponse)),
    ]
  }
}

function onUpdateShopResponse(response: UpdateProfileApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          updateShopResponse: RD.failure(response.error),
          flashMessage: UpdateProfileApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const currentPolicy =
      state.sellerDashboard.profileResponse._t === "Success"
        ? state.sellerDashboard.profileResponse.data.sellerTierPolicy
        : null

    return [
      _SellerDashboardState(state, {
        updateShopResponse: RD.success(response.value),
        profileResponse:
          currentPolicy == null
            ? state.sellerDashboard.profileResponse
            : RD.success({
                seller: response.value.seller,
                sellerTierPolicy: currentPolicy,
              }),
        isEditingShop: false,
        shopName: response.value.seller.shopName.unwrap(),
        shopDescription: response.value.seller.shopDescription.unwrap(),
        flashMessage: "Shop profile updated.",
      }),
      cmd(),
    ]
  }
}

export function onChangeName(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      name: value,
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, name: true },
    }),
    cmd(),
  ]
}

export function onChangeCategoryID(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      categoryID: value,
      flashMessage: null,
      createTouched: {
        ...state.sellerDashboard.createTouched,
        categoryID: true,
      },
    }),
    cmd(),
  ]
}

export function onChangePrice(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      price: value,
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, price: true },
    }),
    cmd(),
  ]
}

export function onChangeDescription(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      description: value,
      flashMessage: null,
      createTouched: {
        ...state.sellerDashboard.createTouched,
        description: true,
      },
    }),
    cmd(),
  ]
}

export function uploadProductImages(files: File[]): Action {
  return (state) => {
    const remainingSlots =
      MAX_PRODUCT_IMAGES - state.sellerDashboard.imageUrls.length

    if (remainingSlots <= 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage: `You can upload up to ${MAX_PRODUCT_IMAGES} images per product.`,
          createTouched: {
            ...state.sellerDashboard.createTouched,
            imageUrls: true,
          },
        }),
        cmd(),
      ]
    }

    const selected = files.slice(0, remainingSlots)
    const { acceptedFiles, warning } = filterUploadFiles(selected)

    if (acceptedFiles.length === 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            warning ??
            `Select at least one valid image under ${MAX_UPLOAD_SIZE_MB} MB.`,
          createTouched: {
            ...state.sellerDashboard.createTouched,
            imageUrls: true,
          },
        }),
        cmd(),
      ]
    }

    const nextState = _SellerDashboardState(state, {
      isUploadingImages: true,
      flashMessage: warning,
      createTouched: {
        ...state.sellerDashboard.createTouched,
        imageUrls: true,
      },
    })

    const uploadCmd = readFilesAsDataUrl(acceptedFiles)
      .then((payload) => UploadImagesApi.call({ files: payload }))
      .then(onUploadImagesResponse)
      .catch(() => onUploadImagesReadFailed())

    return [nextState, cmd(uploadCmd)]
  }
}

export function removeImageUrl(url: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      imageUrls: state.sellerDashboard.imageUrls.filter((item) => item !== url),
      flashMessage: null,
      createTouched: {
        ...state.sellerDashboard.createTouched,
        imageUrls: true,
      },
    }),
    cmd(),
  ]
}

export function onChangeSku(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      sku: value,
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, sku: true },
    }),
    cmd(),
  ]
}

export function onChangeVariantMode(mode: CreateVariantMode): Action {
  return (state) => [
    _SellerDashboardState(state, {
      variantMode: mode,
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, stock: true },
    }),
    cmd(),
  ]
}

export function onChangePresetVariantStock(
  size: PresetVariantSize,
  value: string,
): Action {
  return (state) => [
    _SellerDashboardState(state, {
      presetVariantStocks: {
        ...state.sellerDashboard.presetVariantStocks,
        [size]: value,
      },
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, stock: true },
    }),
    cmd(),
  ]
}

export function onChangeSingleVariantStock(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      singleVariantStock: value,
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, stock: true },
    }),
    cmd(),
  ]
}

export function onAddCustomVariant(): Action {
  return (state) => [
    _SellerDashboardState(state, {
      customVariants: [
        ...state.sellerDashboard.customVariants,
        { name: "", stock: "" },
      ],
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, stock: true },
    }),
    cmd(),
  ]
}

export function onRemoveCustomVariant(index: number): Action {
  return (state) => {
    const filtered = state.sellerDashboard.customVariants.filter(
      (_item, itemIndex) => itemIndex !== index,
    )

    return [
      _SellerDashboardState(state, {
        customVariants:
          filtered.length > 0 ? filtered : [{ name: "", stock: "" }],
        flashMessage: null,
        createTouched: { ...state.sellerDashboard.createTouched, stock: true },
      }),
      cmd(),
    ]
  }
}

export function onChangeCustomVariantName(
  index: number,
  value: string,
): Action {
  return (state) => [
    _SellerDashboardState(state, {
      customVariants: state.sellerDashboard.customVariants.map(
        (variant, variantIndex) =>
          variantIndex === index ? { ...variant, name: value } : variant,
      ),
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, stock: true },
    }),
    cmd(),
  ]
}

export function onChangeCustomVariantStock(
  index: number,
  value: string,
): Action {
  return (state) => [
    _SellerDashboardState(state, {
      customVariants: state.sellerDashboard.customVariants.map(
        (variant, variantIndex) =>
          variantIndex === index ? { ...variant, stock: value } : variant,
      ),
      flashMessage: null,
      createTouched: { ...state.sellerDashboard.createTouched, stock: true },
    }),
    cmd(),
  ]
}

export function clearFlashMessage(): Action {
  return (state) => [
    _SellerDashboardState(state, { flashMessage: null }),
    cmd(),
  ]
}

export function deleteProduct(productID: ProductID): Action {
  return (state) => {
    return [
      _SellerDashboardState(state, {
        flashMessage: null,
        pendingDeleteProductId: productID.unwrap(),
        pendingDeleteProductName: findProductNameById(state, productID),
      }),
      cmd(),
    ]
  }
}

export function cancelDeleteProduct(): Action {
  return (state) => [
    _SellerDashboardState(state, {
      pendingDeleteProductId: null,
      pendingDeleteProductName: null,
    }),
    cmd(),
  ]
}

export function confirmDeleteProduct(): Action {
  return (state) => {
    const rawId = state.sellerDashboard.pendingDeleteProductId
    if (rawId == null) {
      return [state, cmd()]
    }

    let productID: ProductID
    try {
      productID = parseProductID(rawId)
    } catch (_e) {
      return [
        _SellerDashboardState(state, {
          pendingDeleteProductId: null,
          pendingDeleteProductName: null,
          flashMessage: "Invalid product id.",
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        flashMessage: null,
        pendingDeleteProductId: null,
        pendingDeleteProductName: null,
      }),
      cmd(
        DeleteProductApi.call({ id: productID }).then(onDeleteProductResponse),
      ),
    ]
  }
}

function onDeleteProductResponse(response: DeleteProductApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          flashMessage: DeleteProductApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        flashMessage: "Product deleted successfully.",
      }),
      cmd(ProductListApi.call({}).then(onLoadProductListResponse)),
    ]
  }
}

export function editProduct(productID: ProductID): Action {
  return goToEditProductPage(productID)
}

function findProductNameById(state: State, productID: ProductID): string {
  if (state.product.listResponse._t !== "Success") {
    return "this product"
  }

  const found = state.product.listResponse.data.items.find(
    (item) => item.id.unwrap() === productID.unwrap(),
  )

  return found?.name.unwrap() ?? "this product"
}

function filterUploadFiles(files: File[]): {
  acceptedFiles: File[]
  warning: string | null
} {
  const accepted: File[] = []
  let warning: string | null = null

  files.forEach((file) => {
    if (file.type.startsWith("image/") === false) {
      warning = "Only image files are allowed."
      return
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      warning = `Each image must be smaller than ${MAX_UPLOAD_SIZE_MB} MB.`
      return
    }

    accepted.push(file)
  })

  return { acceptedFiles: accepted, warning }
}

function readFilesAsDataUrl(
  files: File[],
): Promise<UploadImagesApi.UploadImageFile[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<UploadImagesApi.UploadImageFile>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result !== "string") {
              reject(new Error("Invalid file result"))
              return
            }

            resolve({
              name: file.name,
              type: file.type,
              dataUrl: reader.result,
            })
          }
          reader.onerror = () =>
            reject(reader.error ?? new Error("Failed to read file"))
          reader.readAsDataURL(file)
        }),
    ),
  )
}

function onUploadImagesResponse(response: UploadImagesApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          isUploadingImages: false,
          flashMessage: UploadImagesApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const newUrls = response.value.urls.map((url) => url.unwrap())
    return [
      _SellerDashboardState(state, {
        isUploadingImages: false,
        imageUrls: [...state.sellerDashboard.imageUrls, ...newUrls],
        flashMessage: null,
      }),
      cmd(),
    ]
  }
}

function onUploadEditImagesResponse(
  response: UploadImagesApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          isUploadingImages: false,
          flashMessage: UploadImagesApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    const newUrls = response.value.urls.map((url) => url.unwrap())
    return [
      _SellerDashboardState(state, {
        isUploadingImages: false,
        editImageUrls: [...state.sellerDashboard.editImageUrls, ...newUrls],
        flashMessage: null,
      }),
      cmd(),
    ]
  }
}

function onUploadImagesReadFailed(): Action {
  return (state) => [
    _SellerDashboardState(state, {
      isUploadingImages: false,
      flashMessage: "Unable to read selected files.",
    }),
    cmd(),
  ]
}

export function submitCreateProduct(): Action {
  return (state) => {
    const availableCategoryIDs =
      state.category.treeResponse._t === "Success"
        ? flattenLeafCategoryIDs(state.category.treeResponse.data)
        : []

    if (availableCategoryIDs.length === 0) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            "No category available yet. Please create categories first.",
          createTouched: {
            ...state.sellerDashboard.createTouched,
            categoryID: true,
          },
        }),
        cmd(),
      ]
    }

    const categoryID =
      state.sellerDashboard.categoryID.trim() === ""
        ? null
        : state.sellerDashboard.categoryID.trim()

    if (
      categoryID == null ||
      availableCategoryIDs.includes(categoryID) === false
    ) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            "Please select a lowest-level child category for this product.",
          createTouched: {
            ...state.sellerDashboard.createTouched,
            categoryID: true,
          },
        }),
        cmd(),
      ]
    }

    const price = Number(state.sellerDashboard.price)
    const variantResult = buildCreateVariants(
      state.sellerDashboard.variantMode,
      state.sellerDashboard.presetVariantStocks,
      state.sellerDashboard.singleVariantStock,
      state.sellerDashboard.customVariants,
      state.sellerDashboard.sku,
      state.sellerDashboard.name,
      price,
    )

    if (variantResult._t === "Err") {
      return [
        _SellerDashboardState(state, {
          flashMessage: variantResult.error,
          createTouched: {
            ...state.sellerDashboard.createTouched,
            stock: true,
          },
        }),
        cmd(),
      ]
    }

    const candidate = {
      name: state.sellerDashboard.name,
      price,
      description: state.sellerDashboard.description,
      urls: state.sellerDashboard.imageUrls,
      categoryID,
      attributes: {},
      variants: variantResult.value,
    }

    const decoded = CreateProductApi.paramsDecoder.decode(candidate)
    if (decoded.ok === false) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            "Invalid product input. Please check name, category, image URL, and ensure price is within 2,147,483,647.",
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        createResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(CreateProductApi.call(decoded.value).then(onCreateResponse)),
    ]
  }
}

function flattenLeafCategoryIDs(categories: Category[]): string[] {
  return categories.flatMap((item) => {
    if (item.children.length === 0) {
      return [item.id.unwrap()]
    }

    return flattenLeafCategoryIDs(item.children)
  })
}

function flattenCategoryIDs(categories: Category[]): string[] {
  return categories.flatMap((item) => [
    item.id.unwrap(),
    ...flattenCategoryIDs(item.children),
  ])
}

function normalizeAttributesForUpdate(value: unknown): Record<string, unknown> {
  try {
    const serialized = JSON.stringify(value)
    if (serialized == null) {
      return {}
    }

    const parsed = JSON.parse(serialized)
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    return JD.record(JD.unknown).verify(parsed)
  } catch (_e) {
    return {}
  }
}

function formatDecodeError(error: Annotation): string {
  const rendered = JD.formatInline(error)
  return rendered.trim() === "" ? "Please check all fields." : rendered
}

function onCreateResponse(response: CreateProductApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SellerDashboardState(state, {
          createResponse: RD.failure(response.error),
          flashMessage: CreateProductApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _SellerDashboardState(state, {
        createResponse: RD.success(response.value),
        flashMessage: "Product created successfully.",
        name: "",
        categoryID: "",
        price: "",
        description: "",
        imageUrls: [],
        sku: "",
        variantMode: "PRESET",
        presetVariantStocks: {
          S: "",
          M: "",
          L: "",
          XL: "",
        },
        singleVariantStock: "",
        customVariants: [{ name: "", stock: "" }],
        isUploadingImages: false,
        createTouched: initCreateProductTouched(),
      }),
      cmd(ProductListApi.call({}).then(onLoadProductListResponse)),
    ]
  }
}

function isInvalidStock(raw: string): boolean {
  const parsed = Number(raw)
  return Number.isFinite(parsed) === false || createStockE(parsed)._t === "Err"
}

function buildCreateVariants(
  mode: CreateVariantMode,
  presetVariantStocks: Record<PresetVariantSize, string>,
  singleVariantStock: string,
  customVariants: Array<{ name: string; stock: string }>,
  rawSku: string,
  rawProductName: string,
  price: number,
):
  | {
      _t: "Ok"
      value: Array<{ name: string; sku: string; price: number; stock: number }>
    }
  | { _t: "Err"; error: string } {
  const baseSku = rawSku.trim()
  const baseName = rawProductName.trim()

  if (mode === "PRESET") {
    const invalidVariantSizes = PRESET_VARIANT_SIZES.filter((size) =>
      isInvalidStock(presetVariantStocks[size]),
    )

    if (invalidVariantSizes.length > 0) {
      return {
        _t: "Err",
        error: `Invalid stock for size: ${invalidVariantSizes.join(", ")}.`,
      }
    }

    return {
      _t: "Ok",
      value: PRESET_VARIANT_SIZES.map((size) => {
        const resolvedSku =
          baseSku === "" ? `${size}` : `${baseSku}-${size.toLowerCase()}`
        const resolvedName =
          baseName === "" ? `Size ${size}` : `${baseName} - ${size}`

        return {
          name: resolvedName,
          sku: resolvedSku,
          price,
          stock: Number(presetVariantStocks[size]),
        }
      }),
    }
  }

  if (mode === "NONE") {
    if (isInvalidStock(singleVariantStock)) {
      return {
        _t: "Err",
        error: "Invalid stock for product without variant.",
      }
    }

    return {
      _t: "Ok",
      value: [
        {
          name: baseName === "" ? "Default" : baseName,
          sku: baseSku === "" ? "default" : baseSku,
          price,
          stock: Number(singleVariantStock),
        },
      ],
    }
  }

  const normalized = customVariants
    .map((variant) => ({
      name: variant.name.trim(),
      stock: variant.stock.trim(),
    }))
    .filter((variant) => variant.name !== "" || variant.stock !== "")

  if (normalized.length === 0) {
    return {
      _t: "Err",
      error: "Please add at least one custom variant.",
    }
  }

  for (const variant of normalized) {
    if (variant.name === "") {
      return {
        _t: "Err",
        error: "Each custom variant must have a name.",
      }
    }

    if (variant.stock === "" || isInvalidStock(variant.stock)) {
      return {
        _t: "Err",
        error: `Invalid stock for custom variant: ${variant.name}.`,
      }
    }
  }

  const customNameDuplicates = normalized
    .map((variant) => variant.name.toLowerCase())
    .filter((name, index, list) => list.indexOf(name) !== index)

  if (customNameDuplicates.length > 0) {
    return {
      _t: "Err",
      error: "Custom variant names must be unique.",
    }
  }

  return {
    _t: "Ok",
    value: normalized.map((variant) => {
      const suffix = variant.name.toLowerCase().replace(/\s+/g, "-")
      const resolvedSku = baseSku === "" ? suffix : `${baseSku}-${suffix}`
      const resolvedName =
        baseName === "" ? variant.name : `${baseName} - ${variant.name}`

      return {
        name: resolvedName,
        sku: resolvedSku,
        price,
        stock: Number(variant.stock),
      }
    }),
  }
}
