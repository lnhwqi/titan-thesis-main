import * as JD from "decoders"
import { BasicProduct } from "../../../Core/App/ProductBasic"
import { basicProductDecoder } from "../../../Core/App/ProductBasic"
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

  const items = parseSavedCart(saved)

  return {
    items,
    isOpen: false,
  }
}

export function _CartState(state: State, cart: Partial<CartState>): State {
  return { ...state, cart: { ...state.cart, ...cart } }
}

const cartItemDecoder: JD.Decoder<CartItem> = JD.object({
  product: basicProductDecoder,
  quantity: JD.number,
})

function parseSavedCart(saved: string | null): CartItem[] {
  if (saved == null || saved.trim() === "") {
    return []
  }

  try {
    const parsed = JSON.parse(saved)
    const items = JD.array(cartItemDecoder).verify(parsed)
    return items.filter((item) => Number.isFinite(item.quantity) && item.quantity > 0)
  } catch (_e) {
    return []
  }
}
