import { BasicProduct } from "../../../Core/App/ProductBasic"
import type { State } from "../State"

export type CartItem = {
  product: BasicProduct
  quantity: number
}

export type CartState = {
  items: CartItem[]
  isOpen: boolean
}

export function initCartState(): CartState {
  const saved = localStorage.getItem("titan_cart")
  return {
    items: saved ? JSON.parse(saved) : [],
    isOpen: false,
  }
}

export function _CartState(state: State, cart: Partial<CartState>): State {
  return { ...state, cart: { ...state.cart, ...cart } }
}
