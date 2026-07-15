import { Action, cmd, perform, type Cmd } from "../Action"
import { State, isAuthUser } from "../State"
import * as Logger from "../Logger"
import { BasicProduct } from "../../../Core/App/ProductBasic"
import { _CartState, CartItem, CartState } from "../State/Cart"
import { navigateTo, toRoute } from "../Route"
import * as CartAddApi from "../Api/Auth/User/Cart/Add"
import * as CartDeleteApi from "../Api/Auth/User/Cart/Delete"
import * as CartUpdateQuantityApi from "../Api/Auth/User/Cart/UpdateQuantity"

function getLineVariant(
  product: BasicProduct,
): BasicProduct["variants"][number] | null {
  const firstVariant = product.variants[0]
  return firstVariant == null ? null : firstVariant
}

function getLineVariantID(product: BasicProduct): string | null {
  const firstVariant = getLineVariant(product)
  return firstVariant == null ? null : firstVariant.id.unwrap()
}

function isSameLine(a: BasicProduct, b: BasicProduct): boolean {
  return (
    a.id.unwrap() === b.id.unwrap() &&
    getLineVariantID(a) === getLineVariantID(b)
  )
}

function getMaxStock(product: BasicProduct): number {
  const firstVariant = product.variants[0]
  if (firstVariant == null) {
    return Number.MAX_SAFE_INTEGER
  }

  const stock = firstVariant.stock.unwrap()
  return stock < 0 ? 0 : stock
}

function saveCartCmd(items: CartItem[]): Promise<Action | null> {
  return new Promise((resolve) => {
    localStorage.setItem("titan_cart", JSON.stringify(items))
    resolve(null)
  })
}

async function syncItemQuantityToDbCmd(item: CartItem): Promise<Action | null> {
  const variant = getLineVariant(item.product)
  if (variant == null) {
    return null
  }

  const params = {
    productID: item.product.id,
    variantID: variant.id,
    quantity: item.quantity,
  }

  try {
    const updateResponse = await CartUpdateQuantityApi.call(params)
    if (updateResponse._t === "Ok") {
      return null
    }

    if (updateResponse.error !== "CART_ITEM_NOT_FOUND") {
      Logger.error(
        `cart quantity sync failed: ${CartUpdateQuantityApi.errorString(updateResponse.error)}`,
      )
      return null
    }

    const addResponse = await CartAddApi.call({
      productID: item.product.id,
      variantID: variant.id,
    })

    if (addResponse._t === "Err") {
      Logger.error(
        `cart add sync failed: ${CartAddApi.errorString(addResponse.error)}`,
      )
      return null
    }

    if (item.quantity <= 1) {
      return null
    }

    const retryResponse = await CartUpdateQuantityApi.call(params)
    if (retryResponse._t === "Err") {
      Logger.error(
        `cart quantity sync retry failed: ${CartUpdateQuantityApi.errorString(retryResponse.error)}`,
      )
    }

    return null
  } catch (err) {
    Logger.error(err)
    return null
  }
}

function syncItemRemovalFromDbCmd(item: CartItem): Promise<Action | null> {
  const variant = getLineVariant(item.product)
  if (variant == null) {
    return Promise.resolve(null)
  }

  return CartDeleteApi.call({
    productID: item.product.id,
    variantID: variant.id,
  })
    .then((response) => {
      if (response._t === "Err") {
        Logger.error(
          `cart remove sync failed: ${CartDeleteApi.errorString(response.error)}`,
        )
      }
      return null
    })
    .catch((err) => {
      Logger.error(err)
      return null
    })
}

function syncClearCartFromDbCmd(items: CartItem[]): Promise<Action | null> {
  return Promise.all(items.map(syncItemRemovalFromDbCmd)).then(() => null)
}

function saveAndReturn(
  state: State,
  cartUpdate: Partial<CartState>,
  ...syncCmds: Array<Promise<Action | null>>
): [State, Cmd] {
  const nextState = _CartState(state, cartUpdate)
  return [nextState, cmd(saveCartCmd(nextState.cart.items), ...syncCmds)]
}

function withAuth(
  state: State,
  authorizedAction: () => [State, Cmd],
): [State, Cmd] {
  if (!isAuthUser(state)) {
    const currentPath = window.location.pathname
    return [
      state,
      cmd(perform(navigateTo(toRoute("Login", { redirect: currentPath })))),
    ]
  }
  return authorizedAction()
}

export function addToCart(product: BasicProduct, quantity: number = 1): Action {
  return (state: State) =>
    withAuth(state, () => {
      const nextQuantity =
        Number.isInteger(quantity) && quantity > 0 ? quantity : 1

      const existingItem = state.cart.items.find((item) =>
        isSameLine(item.product, product),
      )

      if (existingItem == null && getMaxStock(product) <= 0) {
        return [state, cmd()]
      }

      const nextItems =
        existingItem != null
          ? state.cart.items.map((item) =>
              isSameLine(item.product, product)
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + nextQuantity,
                      getMaxStock(item.product),
                    ),
                  }
                : item,
            )
          : [
              ...state.cart.items,
              {
                product,
                quantity: Math.min(nextQuantity, getMaxStock(product)),
              },
            ]

      const syncedItem = nextItems.find((item) =>
        isSameLine(item.product, product),
      )

      return syncedItem == null
        ? saveAndReturn(state, { items: nextItems, isOpen: true })
        : saveAndReturn(
            state,
            { items: nextItems, isOpen: true },
            syncItemQuantityToDbCmd(syncedItem),
          )
    })
}

export function updateQuantity(
  productID: string,
  variantID: string | null,
  delta: number,
): Action {
  return (state: State) =>
    withAuth(state, () => {
      const previousItem = state.cart.items.find((item) => {
        const itemVariantID = getLineVariantID(item.product)
        return (
          item.product.id.unwrap() === productID && itemVariantID === variantID
        )
      })

      const nextItems = state.cart.items
        .map((item) => {
          const itemVariantID = getLineVariantID(item.product)
          const isSameItem =
            item.product.id.unwrap() === productID &&
            itemVariantID === variantID

          if (isSameItem) {
            const maxStock = getMaxStock(item.product)
            const desired = item.quantity + delta
            const newQty = Math.max(0, Math.min(desired, maxStock))
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)

      const updatedItem = nextItems.find((item) => {
        const itemVariantID = getLineVariantID(item.product)
        return (
          item.product.id.unwrap() === productID && itemVariantID === variantID
        )
      })

      if (updatedItem != null) {
        return saveAndReturn(
          state,
          { items: nextItems },
          syncItemQuantityToDbCmd(updatedItem),
        )
      }

      if (previousItem != null) {
        return saveAndReturn(
          state,
          { items: nextItems },
          syncItemRemovalFromDbCmd(previousItem),
        )
      }

      return saveAndReturn(state, { items: nextItems })
    })
}

export function toggleCart(isOpen: boolean): Action {
  return (state: State) =>
    withAuth(state, () => {
      return [_CartState(state, { isOpen }), cmd()]
    })
}

export function clearCart(): Action {
  return (state: State) =>
    withAuth(state, () => {
      return state.cart.items.length === 0
        ? saveAndReturn(state, { items: [], isOpen: false })
        : saveAndReturn(
            state,
            { items: [], isOpen: false },
            syncClearCartFromDbCmd(state.cart.items),
          )
    })
}
