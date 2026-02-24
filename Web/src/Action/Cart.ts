import { Action, cmd, perform, type Cmd } from "../Action"
import { State } from "../State"
import { BasicProduct } from "../../../Core/App/ProductBasic"
import { _CartState, CartItem, CartState } from "../State/Cart"
import { navigateTo, toRoute } from "../Route"

function saveCartCmd(items: CartItem[]): Promise<Action | null> {
  return new Promise((resolve) => {
    localStorage.setItem("titan_cart", JSON.stringify(items))
    resolve(null)
  })
}

function saveAndReturn(
  state: State,
  cartUpdate: Partial<CartState>,
): [State, Cmd] {
  const nextState = _CartState(state, cartUpdate)
  return [nextState, cmd(saveCartCmd(nextState.cart.items))]
}

function withAuth(
  state: State,
  authorizedAction: () => [State, Cmd],
): [State, Cmd] {
  if (state._t !== "AuthUser") {
    const currentPath = window.location.pathname
    return [
      state,
      cmd(perform(navigateTo(toRoute("Login", { redirect: currentPath })))),
    ]
  }
  return authorizedAction()
}

export function addToCart(product: BasicProduct): Action {
  return (state: State) =>
    withAuth(state, () => {
      const existingItem = state.cart.items.find(
        (item) => item.product.id.unwrap() === product.id.unwrap(),
      )

      let nextItems: CartItem[]
      if (existingItem) {
        nextItems = state.cart.items.map((item) =>
          item.product.id.unwrap() === product.id.unwrap()
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      } else {
        nextItems = [...state.cart.items, { product, quantity: 1 }]
      }

      return saveAndReturn(state, { items: nextItems, isOpen: true })
    })
}

export function updateQuantity(productID: string, delta: number): Action {
  return (state: State) =>
    withAuth(state, () => {
      const nextItems = state.cart.items
        .map((item) => {
          if (item.product.id.unwrap() === productID) {
            const newQty = item.quantity + delta
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)

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
      return saveAndReturn(state, { items: [], isOpen: false })
    })
}
