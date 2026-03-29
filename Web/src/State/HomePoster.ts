import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import { Poster } from "../../../Core/App/Poster"
import * as ListActivePosterApi from "../Api/Public/Poster/ListActive"

export type HomePosterState = {
  posters: Poster[]
  response: RD.RemoteData<
    ApiError<ListActivePosterApi.ErrorCode>,
    ListActivePosterApi.Payload
  >
  currentIndex: number
}

export function initHomePosterState(): HomePosterState {
  return {
    posters: [],
    response: RD.notAsked(),
    currentIndex: 0,
  }
}

export function _HomePosterState(
  state: State,
  homePoster: Partial<HomePosterState>,
): State {
  return {
    ...state,
    homePoster: { ...state.homePoster, ...homePoster },
  }
}
