import { Action, cmd } from "../Action"
import { _CoinRainState, FallingCoin, ToastEntry } from "../State/CoinRain"
import { emitCoinPickup } from "../Runtime/Socket"
import * as AuthToken from "../App/AuthToken"

// ---------------------------------------------------------------------------
// Socket event handlers — called by Subscription.ts
// ---------------------------------------------------------------------------

/**
 * Called when the server broadcasts `coin_rain:start`.
 */
export function onCoinRainStart(payload: {
  campaignId: string
  duration: number
  coinPool: { id: string; value: number }[]
}): Action {
  return (state) => {
    const endsAt = Date.now() + payload.duration * 1000
    const coins: FallingCoin[] = payload.coinPool.map((coin) => ({
      id: coin.id,
      value: coin.value,
      xPercent: Math.random() * 90,
      delay: Math.random() * (payload.duration * 0.6),
      claimed: false,
    }))

    return [
      _CoinRainState(state, {
        phase: {
          _t: "Active",
          campaignId: payload.campaignId,
          endsAt,
          coins,
        },
        toasts: [],
      }),
      cmd(),
    ]
  }
}

/**
 * Called when the server broadcasts `coin_rain:end`.
 */
export function onCoinRainEnd(): Action {
  return (state) => [_CoinRainState(state, { phase: { _t: "Ended" } }), cmd()]
}

// ---------------------------------------------------------------------------
// User interactions
// ---------------------------------------------------------------------------

/**
 * User clicks a falling coin.
 */
export function pickupCoin(coinId: string): Action {
  return (state) => {
    // Only authenticated users can pick up coins
    const auth = AuthToken.get()
    if (auth == null) {
      return [
        _CoinRainState(state, {
          toasts: addToast(
            state.coinRain.toasts,
            "Please log in to collect coins!",
            "error",
          ),
        }),
        cmd(),
      ]
    }

    if (state.coinRain.phase._t !== "Active") {
      return [state, cmd()]
    }

    // Optimistically mark the coin as claimed in UI
    const updatedCoins = state.coinRain.phase.coins.map((c) =>
      c.id === coinId ? { ...c, claimed: true } : c,
    )

    return [
      _CoinRainState(state, {
        phase: {
          ...state.coinRain.phase,
          coins: updatedCoins,
        },
      }),
      cmd(
        emitCoinPickup(coinId).then((result) =>
          onPickupResponse(coinId, result),
        ),
      ),
    ]
  }
}

function onPickupResponse(
  coinId: string,
  result: {
    success: boolean
    value?: number
    newBalance?: number
    error?: string
  },
): Action {
  return (state) => {
    if (result.success && result.value != null) {
      return [
        _CoinRainState(state, {
          toasts: addToast(
            state.coinRain.toasts,
            `+${result.value.toLocaleString()} coins added to your wallet!`,
            "success",
          ),
        }),
        cmd(),
      ]
    }

    const message =
      result.error === "COIN_ALREADY_CLAIMED"
        ? "Too slow — someone else grabbed it!"
        : result.error === "EVENT_NOT_ACTIVE"
          ? "The event has ended."
          : "Could not collect this coin."

    // Revert the optimistic update on failure
    const phase = state.coinRain.phase
    const revertedPhase =
      phase._t === "Active"
        ? {
            ...phase,
            coins: phase.coins.map((c) =>
              c.id === coinId ? { ...c, claimed: false } : c,
            ),
          }
        : phase

    return [
      _CoinRainState(state, {
        phase: revertedPhase,
        toasts: addToast(state.coinRain.toasts, message, "error"),
      }),
      cmd(),
    ]
  }
}
export function resetToIdle(): Action {
  return (state) => [
    _CoinRainState(state, {
      phase: { _t: "Idle" },
      toasts: [], // It's good practice to clear leftover toasts when resetting
    }),
    cmd(),
  ]
}
export function dismissToast(id: string): Action {
  return (state) => [
    _CoinRainState(state, {
      toasts: state.coinRain.toasts.filter((t) => t.id !== id),
    }),
    cmd(),
  ]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addToast(
  toasts: ToastEntry[],
  message: string,
  kind: "success" | "error",
): ToastEntry[] {
  const entry: ToastEntry = { id: crypto.randomUUID(), message, kind }
  // Keep at most 5 toasts
  return [...toasts.slice(-4), entry]
}
