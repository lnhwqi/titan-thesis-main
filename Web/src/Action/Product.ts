import { Action, cmd, perform } from "../Action"
import * as ListAllApi from "../Api/Public/Product/ListAll"
import type { SortByOption } from "../../../Core/Api/Public/Product/ListAll"
import * as SearchApi from "../Api/Public/Product/Search"
import * as GetOneApi from "../Api/Public/Product/GetOne"
import * as ListRatingsApi from "../Api/Public/Product/ListRatings"
import * as GetSellerProfileApi from "../Api/Public/Seller/GetProfile"
import * as CategoryGetOneApi from "../Api/Public/Category/GetOne"
import * as ListAvailableVoucherApi from "../Api/Auth/User/Voucher/ListAvailable"
import * as ClaimVoucherApi from "../Api/Auth/User/Voucher/Claim"
import * as WishlistListApi from "../Api/Auth/User/Wishlist/List"
import * as WishlistSaveApi from "../Api/Auth/User/Wishlist/Save"
import * as WishlistRemoveApi from "../Api/Auth/User/Wishlist/Remove"
import * as RD from "../../../Core/Data/RemoteData"
import { navigateTo, toRoute } from "../Route"
import { _ProductState } from "../State/Product"
import { ProductID } from "../../../Core/App/Product/ProductID"
import { CategoryID } from "../../../Core/App/Category/CategoryID"
import { SellerID } from "../../../Core/App/Seller/SellerID"
import { voucherIDDecoder } from "../../../Core/App/Voucher/VoucherID"
import * as AuthToken from "../App/AuthToken"
import { sleep } from "../../../Core/Data/Time/Timer"
import { Category } from "../../../Core/App/Category"

export function loadList(
  params: ListAllApi.UrlParams = {
    categoryID: "",
    name: "",
    page: 1,
    limit: 12,
    sortBy: "newest",
  },
): Action {
  return (state) => {
    const expected = params.name || params.categoryID || ""
    const limit = params.limit ?? state.product.listLimit
    const page = params.page ?? 1
    const sortBy = params.sortBy ?? state.product.listSortBy

    return [
      _ProductState(state, {
        listResponse: RD.loading(),
        searchQuery: "",
        listPage: page,
        listLimit: limit,
        listSortBy: sortBy,
      }),
      cmd(
        ListAllApi.call({
          categoryID: params.categoryID ?? "",
          name: params.name ?? "",
          limit,
          page,
          sortBy,
        }).then((res) => gotListResponse(res, expected)),
      ),
    ]
  }
}

export function selectCategory(categoryId: CategoryID | null): Action {
  return selectCategoryWithNavigation(categoryId, true)
}

export function selectCategoryFromRoute(categoryId: CategoryID): Action {
  return selectCategoryWithNavigation(categoryId, false)
}

function selectCategoryWithNavigation(
  categoryId: CategoryID | null,
  shouldNavigate: boolean,
): Action {
  return (state) => {
    const nextState = _ProductState(state, {
      currentCategoryId: categoryId,
      listResponse: RD.loading(),
      searchQuery: "",
      listPage: 1, // Reset to first page when changing category
      listSortBy: "newest", // Reset to default sort
    })

    if (categoryId === null) {
      return [
        nextState,
        cmd(
          ListAllApi.call({
            categoryID: "",
            name: "",
            page: 1,
            limit: state.product.listLimit,
            sortBy: "newest",
          }).then((res) => gotListResponse(res, "")),
        ),
      ]
    }

    const expectedId = categoryId.unwrap()

    const navigateCmd = shouldNavigate
      ? cmd(perform(navigateTo(toRoute("Category", { id: expectedId }))))
      : cmd()

    // 1. Gọi API lấy Sản phẩm ngay lập tức, không cần đợi chờ ai cả!
    const loadProductsCmd = cmd(
      ListAllApi.call({
        categoryID: expectedId,
        name: "",
        page: 1,
        limit: state.product.listLimit,
        sortBy: "newest",
      }).then((res) => gotListResponse(res, expectedId)),
    )

    // 2. Cập nhật currentCategoryTree (chỉ để phục vụ việc khác của UI nếu cần, không ảnh hưởng tới việc lọc sản phẩm nữa)
    const loadTreeCmd = cmd(
      CategoryGetOneApi.call({ id: categoryId }).then((treeRes): Action => {
        return (currentState) => [
          _ProductState(currentState, {
            currentCategoryTree: treeRes._t === "Ok" ? treeRes.value : null,
          }),
          cmd(),
        ]
      }),
    )

    // Phóng cả 3 lệnh đi cùng lúc, cực nhanh và không sợ đụng nhau.
    return [nextState, [...loadProductsCmd, ...navigateCmd, ...loadTreeCmd]]
  }
}

function _gotCategoryDetailResponse(
  response: CategoryGetOneApi.Response,
): Action {
  return (state) => [
    _ProductState(state, {
      currentCategoryTree: response._t === "Ok" ? response.value : null,
    }),
    cmd(),
  ]
}

function gotListResponse(
  response: ListAllApi.Response | SearchApi.Response,
  expectedQueryOrId: string,
): Action {
  return (state) => {
    const currentSearchQuery = state.product.searchQuery || ""
    const currentCategoryId = state.product.currentCategoryId?.unwrap() || ""

    const isAllProductsRequest = expectedQueryOrId === ""
    const isStale = isAllProductsRequest
      ? currentSearchQuery !== "" || currentCategoryId !== ""
      : currentSearchQuery !== expectedQueryOrId &&
        currentCategoryId !== expectedQueryOrId

    if (isStale) {
      return [state, cmd()]
    }

    if (response._t === "Err") {
      return [
        _ProductState(state, {
          listResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    const selectedCategoryID = state.product.currentCategoryId?.unwrap() ?? null

    if (selectedCategoryID === null) {
      return [
        _ProductState(state, {
          listResponse: RD.success({
            items: response.value.items,
            page: response.value.page ?? 1,
            limit: response.value.limit ?? 12,
            totalCount: response.value.totalCount ?? 0,
          }),
          listPage: response.value.page ?? 1,
          listTotalCount: response.value.totalCount ?? 0,
        }),
        cmd(),
      ]
    }

    const globalCategories =
      state.category.treeResponse._t === "Success"
        ? state.category.treeResponse.data
        : []

    const getAllValidCategoryIds = (cat: Category): string[] => {
      let ids = [cat.id.unwrap()]
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          ids = [...ids, ...getAllValidCategoryIds(child)]
        }
      }
      return ids
    }

    const findCategory = (
      categories: Category[],
      targetId: string,
    ): Category | null => {
      for (const cat of categories) {
        if (cat.id.unwrap() === targetId) return cat
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const selectedCat = findCategory(globalCategories, selectedCategoryID)
    const validCategoryIds = selectedCat
      ? getAllValidCategoryIds(selectedCat)
      : [selectedCategoryID]

    const items = response.value.items.filter((item) =>
      validCategoryIds.includes(item.categoryID.unwrap()),
    )

    return [
      _ProductState(state, {
        listResponse: RD.success({
          items,
          page: response.value.page ?? 1,
          limit: response.value.limit ?? 12,
          totalCount: response.value.totalCount ?? 0,
        }),
        listPage: response.value.page ?? 1,
        listTotalCount: response.value.totalCount ?? 0,
      }),
      cmd(),
    ]
  }
}

export function onChangeQuery(query: string): Action {
  return (state) => [_ProductState(state, { searchQuery: query }), cmd()]
}

export function search(query: string): Action {
  return (state) => [
    _ProductState(state, {
      listResponse: RD.loading(),
      searchQuery: query,
      listPage: 1,
      listSortBy: "newest",
    }),
    cmd(
      SearchApi.call({
        name: query,
        page: 1,
        limit: state.product.listLimit,
        sortBy: "newest",
      }).then((res) => gotListResponse(res, query)),
    ),
  ]
}

export function submitSearch(query: string): Action {
  return (state) => {
    if (!query.trim()) return [state, cmd()]

    const nextState = _ProductState(state, {
      listResponse: RD.loading(),
      searchQuery: query,
      listPage: 1,
      listSortBy: "newest",
    })

    const apiCallCmd = cmd(
      SearchApi.call({
        name: query,
        page: 1,
        limit: state.product.listLimit,
        sortBy: "newest",
      }).then((res) => gotListResponse(res, query)),
    )

    const navigateCmd = cmd(
      perform(navigateTo(toRoute("Search", { name: query }))),
    )

    return [nextState, [...apiCallCmd, ...navigateCmd]]
  }
}

export function changeSortBy(sortBy: SortByOption): Action {
  return (state) => {
    const nextState = _ProductState(state, {
      listSortBy: sortBy,
      listPage: 1, // Reset to first page when changing sort
      listResponse: RD.loading(),
    })

    const categoryID = state.product.currentCategoryId?.unwrap()
    const searchQuery = state.product.searchQuery

    const apiCallCmd = cmd(
      ListAllApi.call({
        categoryID: categoryID ?? "",
        name: "",
        page: 1,
        limit: state.product.listLimit,
        sortBy,
      }).then((res) => gotListResponse(res, searchQuery || categoryID || "")),
    )

    return [nextState, apiCallCmd]
  }
}

export function changeListPage(page: number): Action {
  return (state) => {
    const nextState = _ProductState(state, {
      listPage: page,
      listResponse: RD.loading(),
    })

    const categoryID = state.product.currentCategoryId?.unwrap()
    const searchQuery = state.product.searchQuery

    const apiCallCmd = cmd(
      ListAllApi.call({
        categoryID: categoryID ?? "",
        name: searchQuery || "",
        page,
        limit: state.product.listLimit,
        sortBy: state.product.listSortBy,
      }).then((res) => gotListResponse(res, searchQuery || categoryID || "")),
    )

    return [nextState, apiCallCmd]
  }
}

export function changeRelatedListPage(page: number): Action {
  return (state) => [
    _ProductState(state, { relatedListPage: page < 1 ? 1 : page }),
    cmd(),
  ]
}

export function changeSellerListPage(page: number): Action {
  return (state) => [
    _ProductState(state, { sellerListPage: page < 1 ? 1 : page }),
    cmd(),
  ]
}

function gotDetailResponse(response: GetOneApi.Response): Action {
  return (state) => [
    _ProductState(state, {
      detailResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

/**
 * Writes the full product pool into a dedicated state field so the detail page
 * can find related products and shop names WITHOUT polluting the paginated
 * `listResponse` used by the Home / category pages.
 */
function gotDetailProductPool(response: ListAllApi.Response): Action {
  return (state) => {
    if (response._t === "Err") return [state, cmd()]
    return [
      _ProductState(state, { detailProductPool: response.value.items }),
      cmd(),
    ]
  }
}

function gotRatingsResponse(response: ListRatingsApi.Response): Action {
  return (state) => [
    _ProductState(state, {
      ratingsResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function gotWishlistListResponse(response: WishlistListApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, {
          wishlistBusy: false,
        }),
        cmd(),
      ]
    }

    return [
      _ProductState(state, {
        wishlistProductIDs: response.value.productIDs.map((id) => id.unwrap()),
        wishlistBusy: false,
      }),
      cmd(),
    ]
  }
}

export function loadWishlist(): Action {
  return (state) => {
    const auth = AuthToken.get()
    if (auth == null || auth.role !== "USER") {
      return [_ProductState(state, { wishlistProductIDs: [] }), cmd()]
    }

    return [
      _ProductState(state, { wishlistBusy: true }),
      cmd(WishlistListApi.call().then(gotWishlistListResponse)),
    ]
  }
}

export function loadDetail(id: ProductID): Action {
  return (state) => {
    const auth = AuthToken.get()
    const shouldLoadWishlist = auth != null && auth.role === "USER"

    return [
      _ProductState(state, {
        detailResponse: RD.loading(),
        ratingsResponse: RD.loading(),
        currentImageIndex: 0,
        selectedVariantSize: null,
        selectedQuantity: 1,
        relatedListPage: 1,
        variantReminderVisible: false,
        stockReminderMessage: null,
        wishlistBusy: false,
        wishlistProductIDs: shouldLoadWishlist
          ? state.product.wishlistProductIDs
          : [],
      }),
      (() => {
        const wishlistCmd = shouldLoadWishlist
          ? cmd(WishlistListApi.call().then(gotWishlistListResponse))
          : cmd()

        return [
          ...cmd(GetOneApi.call({ id }).then(gotDetailResponse)),
          ...cmd(
            ListRatingsApi.call({ productID: id }).then(gotRatingsResponse),
          ),
          ...cmd(
            ListAllApi.call({
              categoryID: "",
              name: "",
              page: 1,
              limit: 200,
              sortBy: "newest",
            }).then(gotDetailProductPool),
          ),
          ...wishlistCmd,
        ]
      })(),
    ]
  }
}

export function loadSellerProfile(sellerID: SellerID): Action {
  return (state) => {
    const sellerIdString = sellerID.unwrap()
    const shouldLoadVouchers = state._t === "AuthUser"

    return [
      _ProductState(state, {
        sellerProfileResponse: RD.loading(),
        sellerProductsResponse: RD.loading(),
        sellerVoucherListResponse: shouldLoadVouchers
          ? RD.loading()
          : RD.notAsked(),
        sellerVoucherClaimResponse: RD.notAsked(),
        sellerVoucherClaimingID: null,
        sellerVoucherRecentlyClaimedID: null,
        sellerVoucherFlashMessage: null,
        sellerAvailableVouchers: shouldLoadVouchers
          ? state.product.sellerAvailableVouchers
          : [],
      }),
      [
        ...cmd(
          GetSellerProfileApi.call({ id: sellerID }).then(
            gotSellerProfileResponse,
          ),
        ),
        ...cmd(
          ListAllApi.call({
            categoryID: "",
            name: "",
            page: 1,
            limit: 12,
            sortBy: "newest",
          }).then((response) =>
            gotSellerProductsResponse(response, sellerIdString),
          ),
        ),
        ...(shouldLoadVouchers
          ? cmd(
              ListAvailableVoucherApi.call().then((response) =>
                gotSellerAvailableVouchersResponse(response, sellerIdString),
              ),
            )
          : cmd()),
      ],
    ]
  }
}

function gotSellerAvailableVouchersResponse(
  response: ListAvailableVoucherApi.Response,
  sellerID: string,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, {
          sellerVoucherListResponse: RD.failure(response.error),
          sellerAvailableVouchers: [],
        }),
        cmd(),
      ]
    }

    const vouchers = response.value.vouchers.filter(
      (voucher) =>
        voucher.sellerID.unwrap() === sellerID &&
        voucher.active.unwrap() &&
        voucher.usedCount.unwrap() < voucher.limit.unwrap(),
    )

    return [
      _ProductState(state, {
        sellerVoucherListResponse: RD.success(response.value),
        sellerAvailableVouchers: vouchers,
      }),
      cmd(),
    ]
  }
}

export function clearSellerVoucherFlashMessage(): Action {
  return (state) => [
    _ProductState(state, { sellerVoucherFlashMessage: null }),
    cmd(),
  ]
}

function clearRecentlyClaimedVoucher(voucherID: string): Action {
  return (state) => {
    if (state.product.sellerVoucherRecentlyClaimedID !== voucherID) {
      return [state, cmd()]
    }

    return [
      _ProductState(state, { sellerVoucherRecentlyClaimedID: null }),
      cmd(),
    ]
  }
}

export function claimSellerVoucher(rawVoucherID: string): Action {
  return (state) => {
    if (state._t !== "AuthUser") {
      return [
        state,
        cmd(perform(navigateTo(toRoute("Login", { redirect: null })))),
      ]
    }

    let voucherID
    try {
      voucherID = voucherIDDecoder.verify(rawVoucherID)
    } catch (_e) {
      return [
        _ProductState(state, {
          sellerVoucherFlashMessage: "Invalid voucher id.",
        }),
        cmd(),
      ]
    }

    return [
      _ProductState(state, {
        sellerVoucherClaimResponse: RD.loading(),
        sellerVoucherClaimingID: rawVoucherID,
        sellerVoucherFlashMessage: null,
      }),
      cmd(
        ClaimVoucherApi.call({ voucherID }).then((response) =>
          onClaimSellerVoucherResponse(response, rawVoucherID),
        ),
      ),
    ]
  }
}

function onClaimSellerVoucherResponse(
  response: ClaimVoucherApi.Response,
  claimedVoucherID: string,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, {
          sellerVoucherClaimResponse: RD.failure(response.error),
          sellerVoucherClaimingID: null,
          sellerVoucherFlashMessage: ClaimVoucherApi.errorString(
            response.error,
          ),
        }),
        cmd(),
      ]
    }

    return [
      _ProductState(state, {
        sellerVoucherClaimResponse: RD.success(response.value),
        sellerVoucherClaimingID: null,
        sellerVoucherRecentlyClaimedID: claimedVoucherID,
        sellerVoucherFlashMessage: "Voucher claimed successfully.",
        sellerAvailableVouchers: state.product.sellerAvailableVouchers.filter(
          (voucher) => voucher.id.unwrap() !== claimedVoucherID,
        ),
      }),
      cmd(
        sleep(2200).then(() => clearRecentlyClaimedVoucher(claimedVoucherID)),
      ),
    ]
  }
}

function gotSellerProfileResponse(
  response: GetSellerProfileApi.Response,
): Action {
  return (state) => [
    _ProductState(state, {
      sellerProfileResponse:
        response._t === "Ok"
          ? RD.success(response.value)
          : RD.failure(response.error),
    }),
    cmd(),
  ]
}

function gotSellerProductsResponse(
  response: ListAllApi.Response,
  sellerID: string,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductState(state, {
          listResponse: RD.failure(response.error),
          sellerProductsResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    const items = response.value.items.filter(
      (item) => item.sellerID.unwrap() === sellerID,
    )

    return [
      _ProductState(state, {
        listResponse: RD.success(response.value),
        sellerProductsResponse: RD.success({
          items,
          page: response.value.page ?? 1,
          limit: response.value.limit ?? 10,
          totalCount: response.value.totalCount ?? 0,
        }),
      }),
      cmd(),
    ]
  }
}

export function setImageIndex(index: number): Action {
  return (state) => [_ProductState(state, { currentImageIndex: index }), cmd()]
}

export function setSelectedVariantSize(size: string | null): Action {
  return (state) => [
    _ProductState(state, {
      selectedVariantSize: size,
      variantReminderVisible: false,
    }),
    cmd(),
  ]
}

export function setSelectedQuantity(quantity: number): Action {
  return (state) => [
    _ProductState(state, {
      selectedQuantity:
        Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    }),
    cmd(),
  ]
}

export function showVariantReminder(): Action {
  return (state) => [
    _ProductState(state, { variantReminderVisible: true }),
    cmd(sleep(5000).then(() => clearVariantReminder())),
  ]
}

export function clearVariantReminder(): Action {
  return (state) => [
    _ProductState(state, { variantReminderVisible: false }),
    cmd(),
  ]
}

export function showStockReminder(message: string): Action {
  return (state) => [
    _ProductState(state, { stockReminderMessage: message }),
    cmd(),
  ]
}

export function clearStockReminder(): Action {
  return (state) => [
    _ProductState(state, { stockReminderMessage: null }),
    cmd(),
  ]
}

export function saveToWishlist(productID: ProductID): Action {
  return (state) => {
    const auth = AuthToken.get()
    if (auth == null || auth.role !== "USER") {
      return [state, cmd()]
    }

    return [
      _ProductState(state, { wishlistBusy: true }),
      cmd(WishlistSaveApi.call({ productID }).then(onSaveWishlistResponse)),
    ]
  }
}

function onSaveWishlistResponse(response: WishlistSaveApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [_ProductState(state, { wishlistBusy: false }), cmd()]
    }

    const id = response.value.productID.unwrap()
    const hasID = state.product.wishlistProductIDs.includes(id)

    return [
      _ProductState(state, {
        wishlistBusy: false,
        wishlistProductIDs: hasID
          ? state.product.wishlistProductIDs
          : [...state.product.wishlistProductIDs, id],
      }),
      cmd(),
    ]
  }
}

export function removeFromWishlist(productID: ProductID): Action {
  return (state) => {
    const auth = AuthToken.get()
    if (auth == null || auth.role !== "USER") {
      return [state, cmd()]
    }

    return [
      _ProductState(state, { wishlistBusy: true }),
      cmd(WishlistRemoveApi.call({ productID }).then(onRemoveWishlistResponse)),
    ]
  }
}

function onRemoveWishlistResponse(
  response: WishlistRemoveApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [_ProductState(state, { wishlistBusy: false }), cmd()]
    }

    const id = response.value.productID.unwrap()

    return [
      _ProductState(state, {
        wishlistBusy: false,
        wishlistProductIDs: state.product.wishlistProductIDs.filter(
          (x) => x !== id,
        ),
      }),
      cmd(),
    ]
  }
}
