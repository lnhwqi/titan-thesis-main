import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import * as CreateProductApi from "../Api/Auth/Seller/Product/Create"
import * as SellerProfileApi from "../Api/Auth/Seller/Profile"
import * as UpdateProfileApi from "../Api/Auth/Seller/UpdateProfile"
import * as UploadImagesApi from "../Api/Auth/Seller/Product/UploadImages"
import * as ProductListApi from "../Api/Public/Product/ListAll"
import * as CategoryAction from "./Category"
import { _ProductState } from "../State/Product"
import {
  _SellerDashboardState,
  initCreateProductTouched,
} from "../State/SellerDashboard"

export const MAX_PRODUCT_IMAGES = 5
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)

export function onEnterRoute(): Action {
  return (state) => {
    const [nextState, categoryCmd] = CategoryAction.loadTree()(state)
    return [
      _SellerDashboardState(nextState, {
        profileResponse: RD.loading(),
        flashMessage: null,
      }),
      [
        ...categoryCmd,
        SellerProfileApi.call().then(onLoadSellerProfileResponse),
        ProductListApi.call({}).then(onLoadProductListResponse),
      ],
    ]
  }
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

    return [
      _SellerDashboardState(state, {
        updateShopResponse: RD.success(response.value),
        profileResponse: RD.success({ seller: response.value.seller }),
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
            warning ?? `Select at least one valid image under ${MAX_UPLOAD_SIZE_MB} MB.`,
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

export function onChangeStock(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      stock: value,
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
          reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
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
    const categoryID =
      state.category.treeResponse._t === "Success" &&
      state.category.treeResponse.data.length > 0
        ? state.category.treeResponse.data[0].id.unwrap()
        : null

    if (categoryID == null) {
      return [
        _SellerDashboardState(state, {
          flashMessage:
            "No category available yet. Please create categories first.",
        }),
        cmd(),
      ]
    }

    const price = Number(state.sellerDashboard.price)
    const stock = Number(state.sellerDashboard.stock)

    const candidate = {
      name: state.sellerDashboard.name,
      price,
      description: state.sellerDashboard.description,
      urls: state.sellerDashboard.imageUrls,
      categoryID,
      attributes: {},
      variants: [
        {
          name:
            state.sellerDashboard.name.trim() === ""
              ? "Default"
              : state.sellerDashboard.name,
          sku: state.sellerDashboard.sku,
          price,
          stock,
        },
      ],
    }

    const decoded = CreateProductApi.paramsDecoder.decode(candidate)
    if (decoded.ok === false) {
      return [
        _SellerDashboardState(state, {
          flashMessage: "Invalid product input. Please check all fields.",
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
        price: "",
        description: "",
        imageUrls: [],
        sku: "",
        stock: "",
        isUploadingImages: false,
        createTouched: initCreateProductTouched(),
      }),
      cmd(ProductListApi.call({}).then(onLoadProductListResponse)),
    ]
  }
}
