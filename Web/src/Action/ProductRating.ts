import { Action, cmd } from "../Action"
import { _ProductRatingState } from "../State/ProductRating"
import * as UserCreateRatingApi from "../Api/Auth/User/ProductRating/Create"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import { ratingDecoder } from "../../../Core/App/Product/Rating"
import { ratingFeedbackDecoder } from "../../../Core/App/ProductRating"
import * as RD from "../../../Core/Data/RemoteData"

export function clearFlashMessage(): Action {
  return (state) => [_ProductRatingState(state, { flashMessage: null }), cmd()]
}

export function onChangeScore(key: string, value: string): Action {
  return (state) => [
    _ProductRatingState(state, {
      scoreDraftByKey: { ...state.productRating.scoreDraftByKey, [key]: value },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeFeedback(key: string, value: string): Action {
  return (state) => [
    _ProductRatingState(state, {
      feedbackDraftByKey: {
        ...state.productRating.feedbackDraftByKey,
        [key]: value,
      },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function submitRating(orderID: string, productID: string): Action {
  return (state) => {
    const key = `${orderID}:${productID}`
    const scoreRaw = Number(state.productRating.scoreDraftByKey[key] ?? "0")
    const feedbackRaw =
      state.productRating.feedbackDraftByKey[key]?.trim() || null

    let parsedOrderID: OrderPaymentID
    let parsedProductID: ProductID
    try {
      parsedOrderID = orderPaymentIDDecoder.verify(orderID)
      parsedProductID = productIDDecoder.verify(productID)
    } catch (_e) {
      return [
        _ProductRatingState(state, {
          flashMessage: "Invalid order or product ID.",
        }),
        cmd(),
      ]
    }

    let score
    try {
      score = ratingDecoder.verify(scoreRaw)
    } catch (_e) {
      return [
        _ProductRatingState(state, {
          flashMessage: "Rating score must be between 1 and 5.",
        }),
        cmd(),
      ]
    }

    let feedback = null
    if (feedbackRaw != null) {
      try {
        feedback = ratingFeedbackDecoder.verify(feedbackRaw)
      } catch (_e) {
        return [
          _ProductRatingState(state, {
            flashMessage: "Feedback text is too long.",
          }),
          cmd(),
        ]
      }
    }

    return [
      _ProductRatingState(state, {
        ratingKey: key,
        createResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        UserCreateRatingApi.call({
          orderID: parsedOrderID,
          productID: parsedProductID,
          score,
          feedback,
        }).then((response) => onCreateRatingResponse(key, response)),
      ),
    ]
  }
}

function onCreateRatingResponse(
  key: string,
  response: UserCreateRatingApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductRatingState(state, {
          ratingKey: null,
          createResponse: RD.failure(response.error),
          flashMessage: UserCreateRatingApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ProductRatingState(state, {
        ratingKey: null,
        createResponse: RD.success(response.value),
        flashMessage: `Rating submitted! Score: ${response.value.rating.score.unwrap()}/5`,
      }),
      cmd(),
    ]
  }
}
