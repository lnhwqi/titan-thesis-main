import type { State } from "../State"

/** A single falling coin rendered on screen */
export type FallingCoin = {
  /** Coin ID from the server (used for deduplication and pickup) */
  id: string
  value: number
  /** 0–100 % from left */
  xPercent: number
  /** Animation delay in seconds */
  delay: number
  /** Whether the current user has attempted to claim this coin */
  claimed: boolean
}

export type CoinRainPhase =
  | { _t: "Idle" }
  | { _t: "Active"; campaignId: string; endsAt: number; coins: FallingCoin[] }
  | { _t: "Ended" }

export type ToastEntry = {
  id: string
  message: string
  kind: "success" | "error"
}

export type CoinRainState = {
  phase: CoinRainPhase
  toasts: ToastEntry[]
}

export const initialCoinRainState: CoinRainState = {
  phase: { _t: "Idle" },
  toasts: [],
}

// ---------------------------------------------------------------------------
// Lens
// ---------------------------------------------------------------------------

export function _CoinRainState(
  state: State,
  patch: Partial<CoinRainState>,
): State {
  return { ...state, coinRain: { ...state.coinRain, ...patch } }
}
