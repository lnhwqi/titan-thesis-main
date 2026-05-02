/**
 * CoinRainScheduler
 *
 * Manages the in-process timers that:
 *  1. Fire `coin_rain:start` to all connected clients when a campaign begins.
 *  2. Fire `coin_rain:end`   when the campaign duration expires.
 *
 * Design:
 *  - A single scheduler instance is held module-level.
 *  - The scheduler re-queries the DB at startup and after each admin reschedule.
 *  - If the campaign startTime is in the past but still within its window, we
 *    fire `coin_rain:start` immediately.
 *  - Timers are cleared & reset on reschedule to handle admin updates.
 */
import { Server as SocketIOServer } from "socket.io"
import * as CoinRainRow from "./Database/CoinRainRow"
import * as Logger from "./Logger"
import type { CoinRainCampaignRow } from "./Database/CoinRainRow"

export type CoinRainStartPayload = {
  campaignId: string
  duration: number
  coinPool: { id: string; value: number }[]
}

export type CoinRainEndPayload = {
  campaignId: string
}

let schedulerInstance: CoinRainScheduler | null = null

export function getCoinRainScheduler(): CoinRainScheduler | null {
  return schedulerInstance
}

export class CoinRainScheduler {
  private io: SocketIOServer
  private startTimer: ReturnType<typeof setTimeout> | null = null
  private endTimer: ReturnType<typeof setTimeout> | null = null
  private currentCampaignId: string | null = null

  constructor(io: SocketIOServer) {
    this.io = io
  }

  /** Called once on server startup */
  async init(): Promise<void> {
    const campaign = await CoinRainRow.findActiveCampaign()
    if (campaign != null) {
      this.schedule(campaign)
    }
  }

  /** Called by admin upsert handler to reschedule for a new/updated campaign */
  reschedule(campaign: CoinRainCampaignRow): void {
    this.clearTimers()
    this.schedule(campaign)
  }

  private schedule(campaign: CoinRainCampaignRow): void {
    const now = Date.now()
    const startMs = new Date(campaign.startTime).getTime()
    const endMs = startMs + campaign.duration * 1000
    this.currentCampaignId = campaign.id

    if (now >= endMs) {
      // Campaign already finished — nothing to do
      Logger.log(`CoinRain: campaign ${campaign.id} already ended, skipping`)
      return
    }

    if (now >= startMs) {
      // Campaign is live right now — broadcast immediately
      Logger.log(
        `CoinRain: campaign ${campaign.id} is currently live, firing start now`,
      )
      void this.broadcastStart(campaign)
    } else {
      // Campaign starts in the future
      const delayMs = startMs - now
      Logger.log(
        `CoinRain: campaign ${campaign.id} starts in ${Math.round(delayMs / 1000)}s`,
      )
      this.startTimer = setTimeout(() => {
        void this.broadcastStart(campaign)
      }, delayMs)
    }

    // Schedule end event
    const endDelayMs = endMs - now
    this.endTimer = setTimeout(() => {
      this.broadcastEnd(campaign.id)
    }, endDelayMs)
  }

  private async broadcastStart(campaign: CoinRainCampaignRow): Promise<void> {
    try {
      const coins = await CoinRainRow.listCoinsForCampaign(campaign.id)

      const payload: CoinRainStartPayload = {
        campaignId: campaign.id,
        duration: campaign.duration,
        coinPool: coins
          .filter((c) => c.claimedByUserId == null)
          .map((c) => ({ id: c.id, value: c.value })),
      }

      this.io.emit("coin_rain:start", payload)
      Logger.log(
        `CoinRain: emitted coin_rain:start for campaign ${campaign.id} (${payload.coinPool.length} coins)`,
      )
    } catch (error) {
      Logger.error(error)
    }
  }

  private broadcastEnd(campaignId: string): void {
    const payload: CoinRainEndPayload = { campaignId }
    this.io.emit("coin_rain:end", payload)
    Logger.log(`CoinRain: emitted coin_rain:end for campaign ${campaignId}`)
    this.currentCampaignId = null
  }

  private clearTimers(): void {
    if (this.startTimer != null) {
      clearTimeout(this.startTimer)
      this.startTimer = null
    }
    if (this.endTimer != null) {
      clearTimeout(this.endTimer)
      this.endTimer = null
    }
  }

  getCurrentCampaignId(): string | null {
    return this.currentCampaignId
  }
}

/**
 * Initialize the scheduler singleton.
 * Called once after Socket.IO is set up.
 */
export async function initCoinRainScheduler(io: SocketIOServer): Promise<void> {
  // Ensure the default fallback campaign exists in DB
  await CoinRainRow.ensureDefaultCampaign()

  schedulerInstance = new CoinRainScheduler(io)
  await schedulerInstance.init()
}
