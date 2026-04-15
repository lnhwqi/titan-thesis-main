import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import * as SellerReportSpamApi from "../Api/Auth/Seller/ProductRating/ReportSpam"

export type ProductRatingReportState = {
  reportSpamResponse: RD.RemoteData<
    ApiError<SellerReportSpamApi.ErrorCode>,
    SellerReportSpamApi.Payload
  >
  reportingKey: string | null
  flashMessage: string | null
}

export function initProductRatingReportState(): ProductRatingReportState {
  return {
    reportSpamResponse: RD.notAsked(),
    reportingKey: null,
    flashMessage: null,
  }
}

export function _ProductRatingReportState(
  state: State,
  productRatingReport: Partial<ProductRatingReportState>,
): State {
  return {
    ...state,
    productRatingReport: {
      ...state.productRatingReport,
      ...productRatingReport,
    },
  }
}
