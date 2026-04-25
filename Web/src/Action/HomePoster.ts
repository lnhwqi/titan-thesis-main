import * as RD from "../../../Core/Data/RemoteData"
import * as ListActivePosterApi from "../Api/Public/Poster/ListActive"
import { _HomePosterState } from "../State/HomePoster"
import { emit } from "../Runtime/React"
import { createPositiveInt } from "../../../Core/Data/Number/PositiveInt"
import { throwIfNull } from "../../../Core/Data/Maybe"

import { cmd } from "../Action"
import type { Action } from "../Action"
import { every } from "../../../Core/Data/Time/Timer"
import type { EveryClearFn } from "../../../Core/Data/Time/Timer"

export function load(): Action {
  return (state) => {
    if (state.homePoster.response._t === "Loading") {
      return [state, cmd()]
    }

    return [
      _HomePosterState(state, { response: RD.loading() }),
      cmd(ListActivePosterApi.call().then(onListResponse)),
    ]
  }
}

function onListResponse(response: ListActivePosterApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _HomePosterState(state, {
          response: RD.failure(response.error),
          posters: [],
        }),
        cmd(),
      ]
    }

    return [
      _HomePosterState(state, {
        response: RD.success(response.value),
        posters: response.value.posters,
      }),
      cmd(),
    ]
  }
}

export function nextPoster(): Action {
  return (state) => {
    const { posters, currentIndex } = state.homePoster

    if (posters.length <= 1) {
      return [state, cmd()]
    }

    const nextIndex = currentIndex === posters.length - 1 ? 0 : currentIndex + 1

    return [_HomePosterState(state, { currentIndex: nextIndex }), cmd()]
  }
}

const SLIDER_INTERVAL_MS = throwIfNull(
  createPositiveInt(5000),
  "System Error: Slider interval must be a valid positive integer",
)

type TimerContext = {
  clearFn: EveryClearFn | null
}

const autoPlayCtx: TimerContext = {
  clearFn: null,
}

export function startAutoPlay(): void {
  if (autoPlayCtx.clearFn !== null) {
    return
  }

  autoPlayCtx.clearFn = every(() => {
    emit(nextPoster())
  }, SLIDER_INTERVAL_MS)
}

export function stopAutoPlay(): void {
  if (autoPlayCtx.clearFn !== null) {
    autoPlayCtx.clearFn()
    autoPlayCtx.clearFn = null
  }
}

export function goToPoster(index: number): Action {
  return (state) => {
    const { posters } = state.homePoster
    if (index < 0 || index >= posters.length) {
      return [state, cmd()]
    }
    return [_HomePosterState(state, { currentIndex: index }), cmd()]
  }
}
