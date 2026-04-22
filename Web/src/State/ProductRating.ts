import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as UserCreateRatingApi from "../Api/Auth/User/ProductRating/Create"
import { ProductRating } from "../../../Core/App/ProductRating"

export type ProductRatingState = {
  createResponse: RD.RemoteData<
    ApiError<UserCreateRatingApi.ErrorCode>,
    UserCreateRatingApi.Payload
  >
  ratingKey: string | null
  scoreDraftByKey: Record<string, string>
  feedbackDraftByKey: Record<string, string>
  userRatings: Record<string, ProductRating>
  flashMessage: string | null
}

export function initProductRatingState(): ProductRatingState {
  return {
    createResponse: RD.notAsked(),
    ratingKey: null,
    scoreDraftByKey: {},
    feedbackDraftByKey: {},
    userRatings: {},
    flashMessage: null,
  }
}

export function _ProductRatingState(
  state: State,
  productRating: Partial<ProductRatingState>,
): State {
  return {
    ...state,
    productRating: { ...state.productRating, ...productRating },
  }
}
