import * as SearchApi from "../../../Core/Api/Public/Product/Search"
import { Maybe } from "../../../Core/Data/Maybe"
import * as RD from "../../../Core/Data/RemoteData"
import { ApiError } from "../Api"
import type { State } from "../State"

export type SearchState = {
  query: string
  isCategoryOpen: boolean
  searchResponse: RD.RemoteData<
    ApiError<SearchApi.ErrorCode>,
    SearchApi.Payload
  >
}

export function initSearchState(): SearchState {
  return {
    query: "",
    isCategoryOpen: false,
    searchResponse: RD.notAsked(),
  }
}

export function _SearchState(
  state: State,
  search: Partial<SearchState>,
): State {
  return { ...state, search: { ...state.search, ...search } }
}

export function parseNotValidate(
  searchState: SearchState,
): Maybe<SearchApi.UrlParams> {
  const { query } = searchState

  return query.trim() === "" ? null : { name: query.trim() }
}
