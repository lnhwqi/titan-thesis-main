import { JSX } from "react"
import { css, keyframes } from "@emotion/css"
import { emit } from "../Runtime/React"
import * as CoinRainAction from "../Action/CoinRain"
import type { CoinRainState, FallingCoin, ToastEntry } from "../State/CoinRain"

export type Props = {
  coinRain: CoinRainState
}

// ---------------------------------------------------------------------------
// Keyframe animations
// ---------------------------------------------------------------------------

const fallAnimation = keyframes`
  0%   { transform: translateY(-80px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
`

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const fadeOutAfterDelay = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -40%); }
  10%  { opacity: 1; transform: translate(-50%, -50%); } /* Fade in quickly */
  80%  { opacity: 1; transform: translate(-50%, -50%); } /* Hold for most of the time */
  100% { opacity: 0; transform: translate(-50%, -60%); } /* Fade out */
`
const styles = {
  overlay: css`
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `,

  coin: (xPercent: number, delay: number, claimed: boolean) => css`
    position: absolute;
    top: -80px;
    left: ${xPercent}%;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    cursor: ${claimed ? "default" : "pointer"};
    pointer-events: ${claimed ? "none" : "all"};
    opacity: ${claimed ? 0.3 : 1};
    background: radial-gradient(circle at 35% 35%, #ffe066, #f0a500);
    box-shadow:
      0 2px 12px rgba(240, 165, 0, 0.6),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2);
    animation: ${fallAnimation} ${6 + delay * 0.5}s ${delay}s linear forwards;
    user-select: none;
    transition: transform 0.1s;
    &:hover {
      transform: scale(1.12);
    }
  `,

  coinLabel: css`
    text-align: center;
    line-height: 1.2;
    font-size: 10px;
  `,

  endBanner: css`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.75);
    color: #ffe066;
    font-size: 28px;
    font-weight: 800;
    padding: 24px 40px;
    border-radius: 16px;
    z-index: 10000;
    pointer-events: none;
    /* The animation lasts exactly 3 seconds */
    animation: ${fadeOutAfterDelay} 3s forwards;
  `,

  toastContainer: css`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10001;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: all;
    max-width: 320px;
  `,

  toast: (kind: "success" | "error") => css`
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: ${kind === "success" ? "#16a34a" : "#dc2626"};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    animation: ${fadeIn} 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  `,

  toastClose: css`
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    padding: 0 4px;
    line-height: 1;
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  `,
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CoinItem({ coin }: { coin: FallingCoin }): JSX.Element {
  return (
    <div
      className={styles.coin(coin.xPercent, coin.delay, coin.claimed)}
      onClick={() => {
        if (!coin.claimed) {
          emit(CoinRainAction.pickupCoin(coin.id))
        }
      }}
      title={`${coin.value.toLocaleString()} coins`}
    >
      <span className={styles.coinLabel}>
        {coin.value >= 10000
          ? `${(coin.value / 1000).toFixed(0)}K`
          : coin.value >= 1000
            ? `${(coin.value / 1000).toFixed(1)}K`
            : String(coin.value)}
      </span>
    </div>
  )
}

function Toast({ toast }: { toast: ToastEntry }): JSX.Element {
  return (
    <div className={styles.toast(toast.kind)}>
      <span>{toast.message}</span>
      <button
        className={styles.toastClose}
        onClick={() => emit(CoinRainAction.dismissToast(toast.id))}
      >
        ✕
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CoinRainOverlay({
  coinRain,
}: Props): JSX.Element | null {
  const { phase, toasts } = coinRain

  // Don't render anything when idle and no toasts
  if (phase._t === "Idle" && toasts.length === 0) return null

  return (
    <>
      {phase._t === "Active" && (
        <div
          className={styles.overlay}
          aria-live="polite"
          aria-label="Coin rain event"
        >
          {phase.coins.map((coin) => (
            <CoinItem
              key={coin.id}
              coin={coin}
            />
          ))}
        </div>
      )}

      {phase._t === "Ended" && (
        <div
          className={styles.endBanner}
          role="status"
          // Trigger the state change when the CSS timer finishes!
          onAnimationEnd={() => emit(CoinRainAction.resetToIdle())}
        >
          🎉 Coin Rain Ended!
        </div>
      )}

      {toasts.length > 0 && (
        <div
          className={styles.toastContainer}
          role="status"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <Toast
              key={t.id}
              toast={t}
            />
          ))}
        </div>
      )}
    </>
  )
}
