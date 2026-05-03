import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import { Poster } from "../../../Core/App/Poster"
import * as GetPosterByIDApi from "../Api/Public/Poster/GetByID"

export type EventPosterState = {
  poster: Poster | null
  response: RD.RemoteData<
    ApiError<GetPosterByIDApi.ErrorCode>,
    GetPosterByIDApi.Payload
  >
  errorMessage: string | null
}

export function initEventPosterState(): EventPosterState {
  return {
    poster: null,
    response: RD.notAsked(),
    errorMessage: null,
  }
}

export function _EventPosterState(
  state: State,
  eventPoster: Partial<EventPosterState>,
): State {
  return {
    ...state,
    eventPoster: { ...state.eventPoster, ...eventPoster },
  }
}
