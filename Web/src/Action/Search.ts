import { Action, cmd } from "../Action"
import { _SearchState } from "../State/Search" // Import helper update state
import * as SearchApi from "../Api/Public/Search" // Import API Search
import * as RD from "../../../Core/Data/RemoteData"

export function onChangeQuery(value: string): Action {
  return (state) => {
    return [_SearchState(state, { query: value }), cmd()]
  }
}

export function toggleCategoryMenu(isOpen: boolean): Action {
  return (state) => {
    return [_SearchState(state, { isCategoryOpen: isOpen }), cmd()]
  }
}

export function submit(params: SearchApi.UrlParams): Action {
  return (state) => {
    return [
      _SearchState(state, { searchResponse: RD.loading() }),

      cmd(SearchApi.call(params).then(onSearchResponse)),
    ]
  }
}

function onSearchResponse(response: SearchApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _SearchState(state, {
          searchResponse: RD.failure(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _SearchState(state, {
        searchResponse: RD.success(response.value),
      }),
      cmd(),
    ]
  }
}
