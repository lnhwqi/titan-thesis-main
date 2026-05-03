import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import { _EventPosterState } from "../State/EventPoster"
import * as GetPosterByIDApi from "../Api/Public/Poster/GetByID"

export function onEnterRoute(id: string): Action {
  return (state) => {
    const decoded = GetPosterByIDApi.paramsDecoder.decode({ id })

    if (decoded.ok === false) {
      return [
        _EventPosterState(state, {
          poster: null,
          response: RD.notAsked(),
          errorMessage: "Invalid event link.",
        }),
        cmd(),
      ]
    }

    return [
      _EventPosterState(state, {
        poster: null,
        response: RD.loading(),
        errorMessage: null,
      }),
      cmd(GetPosterByIDApi.call(decoded.value).then(onLoadResponse)),
    ]
  }
}

function onLoadResponse(response: GetPosterByIDApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _EventPosterState(state, {
          poster: null,
          response: RD.failure(response.error),
          errorMessage: GetPosterByIDApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _EventPosterState(state, {
        poster: response.value.poster,
        response: RD.success(response.value),
        errorMessage: null,
      }),
      cmd(),
    ]
  }
}
