import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import * as ListActivePosterApi from "../Api/Public/Poster/ListActive"
import { _HomePosterState } from "../State/HomePoster"

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
