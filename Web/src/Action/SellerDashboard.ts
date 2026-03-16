import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import * as CreateProductApi from "../Api/Auth/Seller/Product/Create"
import * as SellerProfileApi from "../Api/Auth/Seller/Profile"
import * as UpdateProfileApi from "../Api/Auth/Seller/UpdateProfile"
import * as ProductListApi from "../Api/Public/Product/ListAll"
import * as CategoryAction from "./Category"
import { _ProductState } from "../State/Product"
import { _SellerDashboardState } from "../State/SellerDashboard"

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
    }),
    cmd(),
  ]
}

export function onChangePrice(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      price: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeDescription(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      description: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeImageUrl(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      imageUrl: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeSku(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      sku: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeStock(value: string): Action {
  return (state) => [
    _SellerDashboardState(state, {
      stock: value,
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function clearFlashMessage(): Action {
  return (state) => [_SellerDashboardState(state, { flashMessage: null }), cmd()]
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
          flashMessage: "No category available yet. Please create categories first.",
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
      urls: [state.sellerDashboard.imageUrl],
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
        imageUrl: "",
        sku: "",
        stock: "",
      }),
      cmd(ProductListApi.call({}).then(onLoadProductListResponse)),
    ]
  }
}
